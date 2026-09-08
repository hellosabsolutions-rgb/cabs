import IssueReport from '../models/IssueReport.js';
import { Notification } from '../models/Notification.js';

/**
 * @desc Create a new issue report or query
 * @route POST /api/reports
 */
export const createReport = async (req, res, next) => {
  try {
    const {
      title,
      description,
      reportType = 'issue',
      module = 'General',
      priority = 'medium',
      reporterName,
      reporterEmail,
      reporterPhone,
      attachments = [],
      agencyId,
      agencyName,
      userId
    } = req.body;

    if (!title || !description || !reporterName) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and reporter name are required.'
      });
    }

    const report = new IssueReport({
      title: title.trim(),
      description: description.trim(),
      reportType,
      module: module || 'General',
      priority,
      status: 'open',
      reporterName: reporterName.trim(),
      reporterEmail: reporterEmail ? reporterEmail.trim() : '',
      reporterPhone: reporterPhone ? reporterPhone.trim() : '',
      attachments: Array.isArray(attachments) ? attachments : [],
      agencyId: agencyId || null,
      agencyName: agencyName ? agencyName.trim() : '',
      userId: userId || null
    });

    await report.save();

    // Trigger an internal notification for confirmation
    try {
      await Notification.create({
        agencyId: report.agencyId,
        category: 'system',
        priority: report.priority === 'critical' ? 'critical' : 'info',
        title: `${report.reportType === 'query' ? 'Query' : 'Issue'} Submitted (${report.ticketId})`,
        message: `Your report "${report.title}" has been registered and is queued for support review.`,
        link: '/reports',
        metadata: { reportId: report._id, ticketId: report.ticketId }
      });
    } catch (notifErr) {
      console.warn('Notification creation warning on report creation:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `${report.reportType === 'query' ? 'Query' : 'Report'} submitted successfully.`,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all reports with filtering & search
 * @route GET /api/reports
 */
export const getReports = async (req, res, next) => {
  try {
    const {
      agencyId,
      status,
      reportType,
      priority,
      module: moduleFilter,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    if (agencyId) {
      filter.agencyId = agencyId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (reportType && reportType !== 'all') {
      filter.reportType = reportType;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (moduleFilter && moduleFilter !== 'all') {
      filter.module = moduleFilter;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { module: searchRegex },
        { reporterName: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [reports, total] = await Promise.all([
      IssueReport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      IssueReport.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: reports,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get reports summary statistics
 * @route GET /api/reports/stats
 */
export const getReportStats = async (req, res, next) => {
  try {
    const { agencyId } = req.query;
    const filter = {};
    if (agencyId) filter.agencyId = agencyId;

    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      issuesCount,
      queriesCount
    ] = await Promise.all([
      IssueReport.countDocuments(filter),
      IssueReport.countDocuments({ ...filter, status: 'open' }),
      IssueReport.countDocuments({ ...filter, status: 'in_progress' }),
      IssueReport.countDocuments({ ...filter, status: 'resolved' }),
      IssueReport.countDocuments({ ...filter, status: 'closed' }),
      IssueReport.countDocuments({ ...filter, reportType: 'issue' }),
      IssueReport.countDocuments({ ...filter, reportType: 'query' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        issuesCount,
        queriesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single report by ID
 * @route GET /api/reports/:id
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await IssueReport.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update report status, resolution notes, or details
 * @route PATCH /api/reports/:id
 */
export const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, priority, title, description, module } = req.body;

    const report = await IssueReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (status) {
      report.status = status;
      if (status === 'resolved' && !report.resolvedAt) {
        report.resolvedAt = new Date();
      } else if (status !== 'resolved' && status !== 'closed') {
        report.resolvedAt = null;
      }
    }

    if (resolutionNotes !== undefined) {
      report.resolutionNotes = resolutionNotes;
    }

    if (priority) {
      report.priority = priority;
    }

    if (title) report.title = title.trim();
    if (description) report.description = description.trim();
    if (module) report.module = module;

    await report.save();

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete a report
 * @route DELETE /api/reports/:id
 */
export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await IssueReport.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

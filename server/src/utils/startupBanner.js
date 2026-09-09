/**
 * Pretty startup banner for KABPRO API.
 * Never print secrets (JWT, Cloudinary secret, Firebase private key).
 */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const WHITE = '\x1b[37m';

function pad(label, width = 14) {
  return String(label).padEnd(width);
}

function statusLine(ok, label, detail) {
  const icon = ok ? `${GREEN}●${RESET}` : `${RED}●${RESET}`;
  const detailText = detail ? `${DIM}${detail}${RESET}` : '';
  return `  ${icon}  ${BOLD}${pad(label)}${RESET} ${detailText}`;
}

function warnLine(label, detail) {
  return `  ${YELLOW}●${RESET}  ${BOLD}${pad(label)}${RESET} ${DIM}${detail}${RESET}`;
}

/**
 * @param {object} info
 */
export function printStartupBanner(info) {
  const {
    env = 'development',
    port,
    corsOrigins = [],
    mongo,
    firebase,
    cloudinary,
    socket = true
  } = info;

  const isProd = env === 'production';
  const mode = isProd ? 'PRODUCTION' : 'DEVELOPMENT';
  const node = process.version;

  console.log('');
  console.log(`${CYAN}${BOLD}`);
  console.log(`  ╔════════════════════════════════════════════════════════════╗`);
  console.log(`  ║                                                            ║`);
  console.log(`  ║   K A B P R O                                              ║`);
  console.log(`  ║   Fleet Operations API                                     ║`);
  console.log(`  ║   ${mode.padEnd(12)} · Node ${node.padEnd(28)}║`);
  console.log(`  ║                                                            ║`);
  console.log(`  ╚════════════════════════════════════════════════════════════╝${RESET}`);
  console.log(`${DIM}  ────────────────────────────────────────────────────────────${RESET}`);

  console.log(statusLine(true, 'HTTP', `http://localhost:${port}`));
  console.log(statusLine(true, 'Health', `http://localhost:${port}/api/health`));
  console.log(statusLine(true, 'Env', env));

  if (mongo?.connected) {
    console.log(
      statusLine(true, 'MongoDB', `${mongo.host || 'ok'}${mongo.name ? `/${mongo.name}` : ''}`)
    );
  } else {
    console.log(statusLine(false, 'MongoDB', 'not connected'));
  }

  if (firebase?.ready) {
    console.log(
      statusLine(
        true,
        'Firebase',
        `FCM ready · ${firebase.projectId || 'ok'}${firebase.file ? ` · ${firebase.file}` : ''}`
      )
    );
  } else {
    console.log(statusLine(false, 'Firebase', firebase?.error || 'not initialized'));
  }

  if (cloudinary?.ready) {
    console.log(statusLine(true, 'Cloudinary', `ok · cloud ${cloudinary.cloudName}`));
  } else if (cloudinary?.configured) {
    console.log(warnLine('Cloudinary', cloudinary.error || 'configured but ping failed'));
  } else {
    console.log(statusLine(false, 'Cloudinary', cloudinary?.error || 'not configured'));
  }

  console.log(statusLine(socket, 'Socket.IO', '/notifications · /chat · /tracking'));

  if (corsOrigins.length) {
    const shown =
      corsOrigins.length <= 3
        ? corsOrigins.join(', ')
        : `${corsOrigins.slice(0, 2).join(', ')} +${corsOrigins.length - 2} more`;
    console.log(statusLine(true, 'CORS', shown));
  }

  console.log(`${DIM}  ────────────────────────────────────────────────────────────${RESET}`);
  console.log(`${GREEN}${BOLD}  Ready.${RESET}`);
  console.log('');
}

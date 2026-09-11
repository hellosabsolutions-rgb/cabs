export type AttachmentKind = 'image' | 'pdf';

export type Attachment = {
  uri: string;
  name: string;
  mime: string;
  kind: AttachmentKind;
};

/**
 * Wire protocol for /ws/classroom. The server definition lives in
 * apps/api/src/MasterClass.Api/Classroom/ClassroomWebSocket.cs. Keep this
 * file in sync with the message type strings the server emits/accepts.
 */

export type ClassroomAudioFormat = 'webm' | 'wav' | 'ogg';

export interface ConnectParams {
  readonly level: string;
  readonly topic: string;
  readonly voiceId: string;
  readonly locale: string;
  readonly audioFormat?: ClassroomAudioFormat;
}

/* ---------- outbound (client → server) ---------- */

export type ClassroomOutbound =
  | { readonly type: 'locale.set'; readonly locale: string }
  | {
      readonly type: 'student.utterance.begin';
      readonly audioFormat?: ClassroomAudioFormat;
    }
  | { readonly type: 'student.utterance.end' }
  | { readonly type: 'student.text'; readonly text: string }
  | { readonly type: 'session.reset' };

/* ---------- inbound (server → client) ---------- */

export interface TeacherCorrection {
  readonly original: string;
  readonly suggestion: string;
  readonly explanation: string;
}

export type ClassroomInbound =
  | {
      readonly type: 'session.open';
      readonly locale: string;
      readonly level: string;
      readonly topic: string;
    }
  | { readonly type: 'session.locale'; readonly locale: string }
  | {
      readonly type: 'student.transcript';
      readonly text: string;
      readonly language: string | null;
    }
  | {
      readonly type: 'teacher.turn';
      readonly text: string;
      readonly corrections: readonly TeacherCorrection[];
    }
  | { readonly type: 'teacher.audio.begin'; readonly contentType: string }
  | { readonly type: 'teacher.audio.end' }
  | { readonly type: 'session.reset.ok' }
  | { readonly type: 'error'; readonly message: string };

/* ---------- stream events ---------- */

export type ClassroomConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'closed'
  | 'error';

export type ClassroomEvent =
  | { readonly kind: 'connection'; readonly state: ClassroomConnectionState }
  | { readonly kind: 'text'; readonly message: ClassroomInbound }
  | { readonly kind: 'binary'; readonly data: ArrayBuffer }
  | { readonly kind: 'invalid'; readonly raw: string; readonly error: string };

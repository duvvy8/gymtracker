import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, type Result } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';
import { validateBarcode } from '../lib/validation';
import { Dialog } from './Dialog';
import { IconCamera } from './icons';
import { Button, Callout, Field, NumberInput } from './ui';

/**
 * Barcode scanner.
 *
 * Camera handling rules this component exists to keep:
 *
 *   - getUserMedia is only ever reached from a click on "Turn on the
 *     camera". Nothing starts on mount or on navigation.
 *   - The MediaStream is held in a ref and every track is stopped
 *     explicitly on close, on unmount, and on pagehide. The scanner's own
 *     controls.stop() is called as well, but the tracks are not left to it.
 *   - Frames are never captured, stored or sent anywhere. ZXing decodes
 *     from an offscreen canvas it owns and overwrites on each attempt.
 *     There is no toDataURL, no toBlob, and no upload path in this file.
 *   - Permission denial is an expected outcome, not an error state. The
 *     manual entry field below is always available and needs no camera.
 */

type ScannerState = 'idle' | 'starting' | 'scanning' | 'denied' | 'unavailable' | 'failed';

/** Only the retail symbologies this app supports are attempted. */
function buildHints(): Map<DecodeHintType, BarcodeFormat[]> {
  const hints = new Map<DecodeHintType, BarcodeFormat[]>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
  ]);
  return hints;
}

export function BarcodeScanner({
  open,
  onClose,
  onBarcode,
  busy,
  lookupError,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with a barcode that has already passed validation. */
  onBarcode: (barcode: string) => void;
  busy?: boolean;
  /**
   * A failed lookup is reported here rather than through the notice bar.
   * A modal dialog sits in the browser's top layer, so a toast behind it
   * would be invisible at exactly the moment it mattered.
   */
  lookupError?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [state, setState] = useState<ScannerState>('idle');
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | undefined>(undefined);

  /** Releases the camera. Safe to call repeatedly. */
  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, []);

  // The camera is released when the dialog closes, when this component goes
  // away, and when the page is hidden or unloaded.
  useEffect(() => {
    if (!open) {
      stopCamera();
      setState('idle');
      setMessage(undefined);
    }
  }, [open, stopCamera]);

  useEffect(() => {
    const release = () => stopCamera();
    window.addEventListener('pagehide', release);
    return () => {
      window.removeEventListener('pagehide', release);
      stopCamera();
    };
  }, [stopCamera]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      setMessage(
        'This browser will not give a camera to the page. That normally means the site is not being served over HTTPS.',
      );
      return;
    }

    setState('starting');
    setMessage(undefined);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setState('denied');
        setMessage('Camera access was declined. You can still type the barcode number below.');
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setState('unavailable');
        setMessage('No camera was found on this device. Type the barcode number below instead.');
      } else {
        setState('failed');
        setMessage('The camera could not be started. Type the barcode number below instead.');
      }
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stopCamera();
      return;
    }

    try {
      const reader = new BrowserMultiFormatReader(buildHints());
      controlsRef.current = await reader.decodeFromStream(stream, video, (result?: Result) => {
        if (!result) return;

        // Whatever the camera thinks it saw is treated as untrusted input
        // and goes through the same gate as a typed barcode.
        const checked = validateBarcode(result.getText());
        if (!checked.ok) return;

        stopCamera();
        setState('idle');
        onBarcode(checked.value);
      });
      setState('scanning');
    } catch {
      stopCamera();
      setState('failed');
      setMessage('The camera could not be started. Type the barcode number below instead.');
    }
  }

  function submitManual(event: React.FormEvent) {
    event.preventDefault();
    const checked = validateBarcode(manual);
    if (!checked.ok) {
      setManualError(checked.error);
      return;
    }
    setManualError(undefined);
    stopCamera();
    onBarcode(checked.value);
  }

  const scanning = state === 'scanning' || state === 'starting';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Scan a barcode"
      description="Point the camera at the barcode on the packet."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="grid gap-4">
        {!scanning ? (
          <div className="rounded-md border border-line bg-sunken px-4 py-5 text-center">
            <p className="mx-auto max-w-(--container-measure) text-sm text-ink-2">
              The camera is only switched on when you ask for it, and the picture never leaves this
              device. The barcode is read here in the browser and the frame is discarded.
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => void startCamera()}>
                <IconCamera />
                Turn on the camera
              </Button>
            </div>
          </div>
        ) : null}

        {/* The video element stays mounted so the stream has somewhere to
            attach the moment permission is granted. */}
        <div className={scanning ? 'block' : 'hidden'}>
          <div className="relative overflow-hidden rounded-md border border-line bg-ink">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-1/2 h-24 -translate-y-1/2 rounded-sm border-2 border-white"
            />
          </div>
          <p className="mt-2 text-center text-sm text-ink-2" aria-live="polite">
            {state === 'starting' ? 'Starting the camera.' : 'Looking for a barcode.'}
          </p>
          <div className="mt-3 flex justify-center">
            <Button
              onClick={() => {
                stopCamera();
                setState('idle');
              }}
            >
              Turn the camera off
            </Button>
          </div>
        </div>

        {message ? (
          <Callout tone={state === 'denied' ? 'neutral' : 'error'}>{message}</Callout>
        ) : null}

        {lookupError ? <Callout tone="error">{lookupError}</Callout> : null}

        {busy ? <Callout>Looking that barcode up.</Callout> : null}

        <form onSubmit={submitManual} noValidate className="border-t border-line pt-4">
          <Field
            label="Or type the barcode number"
            hint="8, 12 or 13 digits, printed under the bars"
            error={manualError}
          >
            {({ id, describedBy, invalid }) => (
              <div className="flex gap-2">
                <NumberInput
                  id={id}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={manual}
                  maxLength={13}
                  onChange={(event) => {
                    setManual(event.target.value);
                    setManualError(undefined);
                  }}
                  placeholder="3017624010701"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={busy}
                  className="shrink-0 whitespace-nowrap"
                >
                  Look up
                </Button>
              </div>
            )}
          </Field>
        </form>
      </div>
    </Dialog>
  );
}

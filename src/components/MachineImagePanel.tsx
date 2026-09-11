import { useState } from 'react';
import type { GymMachine } from '../types';
import { Dialog } from './Dialog';
import { IconExpand } from './icons';
import { Button } from './ui';

export function MachineImagePanel({
  machine,
  detail = false,
}: {
  machine: GymMachine;
  detail?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const thumbnailPath = machine.imagePath?.replace(/\.webp$/, '-600.webp');

  return (
    <>
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-md border border-line bg-sunken ${detail ? 'min-h-72 p-6' : 'min-h-48 p-4'}`}
      >
        {machine.imagePath ? (
          <>
            <img
              src={detail ? machine.imagePath : thumbnailPath}
              alt={machine.alt}
              width={detail ? 1200 : 600}
              height={detail ? 1200 : 600}
              loading="lazy"
              decoding="async"
              className={`h-auto w-full object-contain ${detail ? 'max-h-96' : 'max-h-56'}`}
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-3 right-3 rounded-md bg-surface shadow-card"
              onClick={() => setExpanded(true)}
              aria-label={`Enlarge ${machine.displayName} image`}
            >
              <IconExpand />
            </Button>
          </>
        ) : (
          <p className="text-sm font-medium text-ink-3">Image coming soon</p>
        )}
      </div>

      {machine.imagePath ? (
        <Dialog
          retainOnClose
          open={expanded}
          onClose={() => setExpanded(false)}
          title={machine.displayName}
          description="Machine reference image"
          size="wide"
          className="image-lightbox"
          footer={<Button onClick={() => setExpanded(false)}>Close image</Button>}
        >
          {expanded ? (
            <div className="flex items-center justify-center rounded-md bg-sunken p-4 sm:p-8">
              <img
                src={machine.imagePath}
                alt={machine.alt}
                width="1200"
                height="1200"
                decoding="async"
                className="h-auto max-h-(--container-image-max-height) w-full object-contain"
              />
            </div>
          ) : null}
        </Dialog>
      ) : null}
    </>
  );
}

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CertificateProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  team: string;
  programName: string;
  position: string;
  grade: string;
}

const getPositionText = (position: string): string => {
  if (!position || isNaN(parseInt(position))) return '';
  const posNum = parseInt(position);
  if (posNum === 1) return 'the First Position';
  if (posNum === 2) return 'the Second Position';
  if (posNum === 3) return 'the Third Position';
  const lastDigit = posNum % 10;
  const lastTwoDigits = posNum % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `the ${posNum}th Position`;
  switch (lastDigit) {
    case 1: return `the ${posNum}st Position`;
    case 2: return `the ${posNum}nd Position`;
    case 3: return `the ${posNum}rd Position`;
    default: return `the ${posNum}th Position`;
  }
};

export const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(
  ({ className, name, team, programName, position, grade, ...props }, ref) => {
    
    const achievementText = () => {
      const positionText = getPositionText(position);
      if (positionText) {
        return `for securing ${positionText}${grade ? ` with an ${grade} Grade` : ''}`;
      }
      if (grade) {
        return `for achieving an ${grade} Grade`;
      }
      return 'for their valuable participation';
    };

    return (
      <div> {/* Use default theme for on-screen view */}
        <div
          id="certificate-wrapper"
          className={cn("", className)}
          {...props}
        >
          <div
            id="certificate"
            ref={ref}
            style={{ width: '900px', height: '621px' }}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-background p-2 shadow-2xl transition-all duration-300 print:border-gray-800 print:bg-white print:text-black print:!w-[1200px] print:!h-[828px]"
          >
            {/* Background Elements Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
              {/* Main Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50 dark:from-primary/10 dark:via-background dark:to-amber-500/10 print:bg-white" />
              
              {/* Watermark Logo */}
              <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="Watermark" className="absolute inset-0 m-auto h-2/5 w-2/5 opacity-[0.03] print:opacity-5" />

              {/* Abstract Blobs */}
              <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl print:hidden" />
              <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-amber-500/10 blur-3xl print:hidden" />

              {/* Dot Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)] print:hidden"></div>
            </div>

            {/* Decorative Double Frame */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between rounded-[inherit] border-2 border-primary/10 p-1 print:border-gray-300">
              <div className="flex h-full w-full flex-col items-center justify-between rounded-[inherit] border border-amber-400/20 p-5 text-center print:border-gray-400">
                
                {/* Seal */}
                <div className="absolute bottom-6 right-6 z-20 h-16 w-16 rounded-full border-2 border-amber-400/30 bg-background/50 p-1.5 backdrop-blur-sm print:bottom-8 print:right-8 print:h-20 print:w-20 print:p-2 print:border-amber-500 print:bg-white/50">
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-amber-400/50">
                    <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="Seal" className="h-10 w-10 opacity-80 print:h-12 print:w-12" />
                  </div>
                </div>

                {/* Header */}
                <div className="flex w-full items-start justify-between px-6 pt-3 print:px-8 print:pt-4">
                  <div className="text-left">
                    <p className="font-semibold text-foreground print:text-black text-sm">KHANDAQ '25</p>
                    <p className="text-xs text-muted-foreground print:text-gray-500">Arts Festival</p>
                  </div>
                  <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="Logo" className="h-12 print:h-16" />
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center -mt-8 print:-mt-12">
                  <p className="font-semibold uppercase tracking-[0.25em] text-amber-500 dark:text-amber-400 print:text-amber-600 text-xs print:text-sm print:tracking-[0.3em]">
                    Certificate of Achievement
                  </p>
                  <h2 className="my-3 max-w-full truncate bg-gradient-primary bg-clip-text text-center text-5xl font-extrabold text-transparent print:my-4 print:bg-none print:text-pink-600 print:text-5xl">
                    {name}
                  </h2>
                  <p className="text-lg font-medium text-muted-foreground print:text-xl print:text-gray-700">of Team <strong className="text-foreground print:text-black">{team}</strong></p>
                </div>

                {/* Footer */}
                <div className="w-full max-w-2xl text-center pb-6 print:pb-8 print:max-w-3xl">
                  <p className="text-base text-muted-foreground print:text-lg print:text-gray-600 leading-relaxed">
                    {achievementText()} in the program <strong className="font-semibold text-foreground print:text-black">"{programName}"</strong><br />during the KHANDAQ '25 Arts Festival.
                  </p>
                  <div className="mt-10 flex items-center justify-center gap-12 print:mt-14 print:gap-16">
                    <div className="text-center">
                      <p className="font-bold text-lg font-signature text-foreground print:text-black print:text-xl">Chairman</p>
                      <div className="w-36 border-b border-dashed border-foreground/50 my-1.5 print:w-48 print:my-2"></div>
                      <p className="text-xs text-muted-foreground print:text-gray-500">Fest Committee</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg font-signature text-foreground print:text-black print:text-xl">Convenor</p>
                      <div className="w-36 border-b border-dashed border-foreground/50 my-1.5 print:w-48 print:my-2"></div>
                      <p className="text-xs text-muted-foreground print:text-gray-500">Fest Committee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
Certificate.displayName = 'Certificate';

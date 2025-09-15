import { Separator } from './ui/separator';

interface TickerProps {
  items: string[];
}

export const Ticker = ({ items }: TickerProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  // Duplicate the items for a seamless loop
  const tickerItems = [...items, ...items];

  return (
    <div className="relative w-full h-12 overflow-hidden bg-background/50 backdrop-blur-sm">
      <div className="absolute inset-0 flex items-center animate-ticker-scroll">
        {tickerItems.map((item, index) => (
          <div key={index} className="flex items-center flex-shrink-0">
            <span className="text-sm font-semibold uppercase tracking-wider px-6 whitespace-nowrap">
              {item}
            </span>
            <Separator orientation="vertical" className="h-4 bg-border/50" />
          </div>
        ))}
      </div>
    </div>
  );
};

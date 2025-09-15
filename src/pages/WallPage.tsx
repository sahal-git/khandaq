import { useState, useMemo, useEffect, useRef } from 'react';
import { useResultsData, ResultEntry } from '@/hooks/useResultsData';
import { ResultCard } from '@/components/ResultCard';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Trophy, Loader2, Play, Pause } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Clock } from '@/components/Clock';
import { Ticker } from '@/components/Ticker';
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const WallPage = () => {
  const webappUrl = 'https://script.google.com/macros/s/AKfycbzYuQKwLM-z4iT8qemGv3r2HLGjDK-fiH6Hs04JbUkhrXsVAi4hB30VjTHml68FNFj6aA/exec';
  
  const { data, loading, error, refetch } = useResultsData({ webappUrl });
  const [publishedPrograms, setPublishedPrograms] = useState<string[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(true);
  const [isAutoplaying, setIsAutoplaying] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  useEffect(() => {
    if (!api) {
      return;
    }

    const onPlay = () => setIsAutoplaying(true);
    const onStop = () => setIsAutoplaying(false);

    api.on("autoplay:play", onPlay);
    api.on("autoplay:stop", onStop);
    
    // Set initial state from the plugin
    setIsAutoplaying(autoplayPlugin.current.isPlaying());

    return () => {
      api.off("autoplay:play", onPlay);
      api.off("autoplay:stop", onStop);
    };
  }, [api]);


  const fetchPublishedPrograms = async () => {
    setLoadingPublished(true);
    const { data, error } = await supabase
      .from('program_status')
      .select('program_code')
      .eq('is_published', true);

    if (data) {
      setPublishedPrograms(data.map(p => p.program_code));
    }
    if (error) {
        toast.error("Error fetching published programs", {
          description: error.message,
        });
    }
    setLoadingPublished(false);
  };

  useEffect(() => {
    fetchPublishedPrograms();
    // Refetch data every 5 minutes
    const interval = setInterval(() => {
        refetch();
        fetchPublishedPrograms();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const publicData = useMemo(() => {
    return data.filter(entry => publishedPrograms.includes(entry.programCode));
  }, [data, publishedPrograms]);

  const groupedData = useMemo(() => {
    const groups: Record<string, ResultEntry[]> = {};
    
    publicData.forEach(entry => {
      const key = entry.programCode;
      if (!key) return;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });
    
    const sortedGroupEntries = Object.entries(groups).sort((a, b) => {
      const getLatestIndex = (entries: ResultEntry[]) => {
        return Math.max(...entries.map(entry => 
          data.findIndex(dataEntry => 
            dataEntry.programCode === entry.programCode && 
            dataEntry.chestNo === entry.chestNo &&
            dataEntry.candidateName === entry.candidateName
          )
        ));
      };
      
      const latestIndexA = getLatestIndex(a[1]);
      const latestIndexB = getLatestIndex(b[1]);
      
      return latestIndexB - latestIndexA;
    });

    return sortedGroupEntries;
  }, [publicData, data]);

  const tickerItems = useMemo(() => {
    return groupedData.map(([_, entries]) => {
      const programInfo = entries[0];
      return `${programInfo.programCode}: ${programInfo.programName}`;
    });
  }, [groupedData]);

  const toggleAutoplay = () => {
    const autoplay = autoplayPlugin.current;
    if (!autoplay) return;

    if (autoplay.isPlaying()) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
  };

  const isLoading = loading || loadingPublished;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-semibold">Fetching Latest Results...</h2>
            <p className="text-muted-foreground">Please wait a moment.</p>
        </div>
      );
    }

    if (error) {
      return <ErrorMessage message={error} onRetry={refetch} />;
    }

    if (groupedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Trophy className="h-24 w-24 text-muted-foreground/50 mx-auto mb-6" />
            <h2 className="text-3xl font-bold">Awaiting Results</h2>
            <p className="text-xl text-muted-foreground mt-2">The stage is set. Results will appear here as they are published!</p>
        </div>
      );
    }

    return (
      <Carousel
        setApi={setApi}
        className="w-full h-full"
        plugins={[autoplayPlugin.current]}
        opts={{
          loop: true,
          align: "start",
        }}
      >
        <CarouselContent className="-ml-4 h-full">
          {groupedData.map(([programCode, entries], index) => {
            const programInfo = entries[0];
            return (
              <CarouselItem key={`${programCode}-${index}`} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 h-full py-2">
                <ResultCard
                  programCode={programCode}
                  programName={programInfo.programName}
                  programSection={programInfo.programSection}
                  entries={entries}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-transparent text-foreground">
      <header className="flex-shrink-0 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="KHANDAQ '25 Logo" className="h-10 sm:h-12" />
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">KHANDAQ '25</span>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleAutoplay}>
                        {isAutoplaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        <span className="sr-only">Toggle Autoplay</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isAutoplaying ? 'Pause' : 'Play'} Slideshow</p>
                </TooltipContent>
            </Tooltip>
            <Clock />
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 bg-accent text-accent-foreground text-center py-2 shadow-inner">
        <p className="text-sm font-medium tracking-wide">
          See your full results at <a href="https://khandaq.netlify.app" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-primary transition-colors">khandaq.netlify.app</a>
        </p>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden container mx-auto px-4 sm:px-6 pt-4 pb-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            RESULTS
        </h1>
        <div className="flex-1 overflow-hidden relative">
            {renderContent()}
        </div>
      </main>

      <footer className="flex-shrink-0 border-t">
        <Ticker items={tickerItems} />
      </footer>
    </div>
  );
};

export default WallPage;

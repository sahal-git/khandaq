import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as htmlToImage from "html-to-image";
import { useResultsData, ResultEntry } from "@/hooks/useResultsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Certificate } from "@/components/Certificate";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Award, Search, Download, Printer, Home, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  chestNo: z.string().min(1, { message: "Chest number is required." }),
});

type CertificateData = {
  name: string;
  team: string;
  programName: string;
  position: string;
  grade: string;
};

const getTeamFullName = (teamCode: string): string => {
  const teamMap: { [key: string]: string } = {
    'AR': 'ALMARIA',
    'TD': 'TOLIDO',
    'ZR': 'ZARAGOZA'
  };
  return teamMap[teamCode] || teamCode;
};

const CertificatePage = () => {
  const webappUrl = 'https://script.google.com/macros/s/AKfycbzYuQKwLM-z4iT8qemGv3r2HLGjDK-fiH6Hs04JbUkhrXsVAi4hB30VjTHml68FNFj6aA/exec';
  const { data: resultsData, loading: dataLoading } = useResultsData({ webappUrl });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundEntries, setFoundEntries] = useState<ResultEntry[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  
  const certificateRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { chestNo: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    setFoundEntries([]);
    setSelectedCertificate(null);

    setTimeout(() => {
      const allEntriesForParticipant = resultsData.filter(
        entry => entry.chestNo.toLowerCase() === values.chestNo.toLowerCase()
      );

      if (allEntriesForParticipant.length > 0) {
        setFoundEntries(allEntriesForParticipant);
      } else {
        setError(`No participant found with Chest Number "${values.chestNo}". Please check the number and try again.`);
      }
      setLoading(false);
    }, 500);
  };

  const handleGenerateCertificate = (entry: ResultEntry) => {
    setSelectedCertificate({
      name: entry.candidateName,
      team: getTeamFullName(entry.teamCode),
      programName: entry.programName,
      position: entry.position,
      grade: entry.grade,
    });
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleDownload = () => {
    if (certificateRef.current) {
      htmlToImage.toPng(certificateRef.current, { cacheBust: true, pixelRatio: 1 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `KHANDAQ_25_Certificate_${selectedCertificate?.name.replace(/ /g, '_')}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Oops, something went wrong!', err);
        });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setSelectedCertificate(null);
    setFoundEntries([]);
    form.reset();
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background" id="page-container">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="KHANDAQ '25 Logo" className="h-8" />
            <span className="font-bold hidden sm:inline">KHANDAQ '25</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link to="/"><Home className="h-4 w-4" /></Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="container py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          {!selectedCertificate && (
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-6xl mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Generate Your Certificate
              </h1>
              <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground mb-8">
                Enter your chest number to find your achievements and generate a personalized certificate of participation or victory.
              </p>
              
              <Card id="form-card" className="max-w-lg mx-auto">
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                      <FormField
                        control={form.control}
                        name="chestNo"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="sr-only">Chest Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., AR123" {...field} disabled={loading || dataLoading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={loading || dataLoading}>
                        {loading || dataLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="mr-2 h-4 w-4" />
                        )}
                        Find
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-12 space-y-12">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Not Found</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {foundEntries.length > 0 && !selectedCertificate && (
              <Card>
                <CardHeader>
                  <CardTitle>Select an Achievement</CardTitle>
                  <CardDescription>
                    Found {foundEntries.length} result(s) for <strong>{foundEntries[0].candidateName}</strong>. Select one to generate a certificate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <ul className="divide-y">
                      {foundEntries.map((entry, index) => (
                        <li key={index} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted/50">
                          <div>
                            <p className="font-semibold">{entry.programName}</p>
                            <p className="text-sm text-muted-foreground">
                              Position: <span className="font-medium text-foreground">{entry.position || 'N/A'}</span> • Grade: <span className="font-medium text-foreground">{entry.grade || 'N/A'}</span>
                            </p>
                          </div>
                          <Button size="sm" onClick={() => handleGenerateCertificate(entry)}>
                            <Award className="mr-2 h-4 w-4" />
                            Generate
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCertificate && (
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Preview</CardTitle>
                  <CardDescription>
                    This is a preview of your certificate. Use the buttons below to download or print. The on-screen preview is always dark, but it will print on a light background.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 p-4 md:p-6">
                  <div className="overflow-auto rounded-lg border bg-background/50 p-2">
                    <Certificate
                      ref={certificateRef}
                      name={selectedCertificate.name}
                      team={selectedCertificate.team}
                      programName={selectedCertificate.programName}
                      position={selectedCertificate.position}
                      grade={selectedCertificate.grade}
                    />
                  </div>
                  <div id="action-buttons" className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t">
                    <Button onClick={handleDownload} size="lg">
                      <Download className="mr-2 h-4 w-4" />
                      Download PNG
                    </Button>
                    <Button variant="outline" onClick={handlePrint} size="lg">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                      <Search className="mr-2 h-4 w-4" />
                      Find Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CertificatePage;

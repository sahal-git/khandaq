import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useResultsData } from '@/hooks/useResultsData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldOff, Home, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ProgramStatus {
  program_code: string;
  is_published: boolean;
}

const AdminPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const webappUrl = 'https://script.google.com/macros/s/AKfycbzYuQKwLM-z4iT8qemGv3r2HLGjDK-fiH6Hs04JbUkhrXsVAi4hB30VjTHml68FNFj6aA/exec';
  
  const { data: resultsData, loading: resultsLoading } = useResultsData({ webappUrl });
  const [statuses, setStatuses] = useState<ProgramStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setLoadingStatuses(true);
    const { data, error } = await supabase.from('program_status').select('program_code, is_published');
    if (error) {
      toast.error('Failed to fetch statuses', { description: error.message });
    } else {
      setStatuses(data || []);
    }
    setLoadingStatuses(false);
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const uniquePrograms = useMemo(() => {
    const programs = new Map<string, { name: string; section: string; status: string }>();
    resultsData.forEach(item => {
      if (item.programCode && !programs.has(item.programCode)) {
        programs.set(item.programCode, {
          name: item.programName,
          section: item.programSection,
          status: item.status, // Capture the status from the CSV data
        });
      }
    });
    return Array.from(programs.entries()).map(([code, { name, section, status }]) => ({ code, name, section, status }));
  }, [resultsData]);

  useEffect(() => {
    if (resultsLoading || loadingStatuses || !uniquePrograms.length) {
      return;
    }

    const programsToPublish: { program_code: string; is_published: boolean; updated_at: string }[] = [];
    const statusMap = new Map(statuses.map(s => [s.program_code, s.is_published]));

    uniquePrograms.forEach(program => {
      const isPublishedInCsv = program.status.toLowerCase() === 'published';
      const isPublishedInDb = statusMap.get(program.code) || false;

      if (isPublishedInCsv && !isPublishedInDb) {
        programsToPublish.push({
          program_code: program.code,
          is_published: true,
          updated_at: new Date().toISOString(),
        });
      }
    });

    if (programsToPublish.length > 0) {
      const autoPublish = async () => {
        toast.info(`Found ${programsToPublish.length} program(s) to auto-publish...`);
        const { error } = await supabase
          .from('program_status')
          .upsert(programsToPublish, { onConflict: 'program_code' });

        if (error) {
          toast.error('Auto-publish failed', { description: error.message });
        } else {
          toast.success(`${programsToPublish.length} program(s) were auto-published.`);
          fetchStatuses(); // Refresh statuses from DB to update UI
        }
      };

      autoPublish();
    }
  }, [uniquePrograms, statuses, resultsLoading, loadingStatuses, fetchStatuses]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    toast.info('You have been logged out.');
  };

  const combinedData = useMemo(() => {
    return uniquePrograms.map(program => {
      const status = statuses.find(s => s.program_code === program.code);
      return {
        ...program,
        is_published: status ? status.is_published : false,
      };
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [uniquePrograms, statuses]);

  const handleStatusChange = async (program_code: string, is_published: boolean) => {
    setIsUpdating(program_code);
    const { error } = await supabase
      .from('program_status')
      .upsert({ program_code, is_published, updated_at: new Date().toISOString() }, { onConflict: 'program_code' });
    
    setIsUpdating(null);
    if (error) {
      toast.error(`Failed to update ${program_code}`, { description: error.message });
    } else {
      toast.success(`${program_code} has been ${is_published ? 'published' : 'unpublished'}.`);
      setStatuses(prev => {
        const existing = prev.find(s => s.program_code === program_code);
        if (existing) {
          return prev.map(s => s.program_code === program_code ? { ...s, is_published } : s);
        }
        return [...prev, { program_code, is_published }];
      });
    }
  };

  const handleBulkUpdate = async (publish: boolean) => {
    setIsBulkUpdating(true);
    const updates = uniquePrograms.map(p => ({
      program_code: p.code,
      is_published: publish,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('program_status').upsert(updates, { onConflict: 'program_code' });

    setIsBulkUpdating(false);
    if (error) {
      toast.error('Bulk update failed', { description: error.message });
    } else {
      toast.success(`All programs have been ${publish ? 'published' : 'unpublished'}.`);
      fetchStatuses(); // Refetch all statuses
    }
  };

  const isLoading = resultsLoading || loadingStatuses;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="KHANDAQ '25 Logo" className="h-8 w-8" />
            <span className="font-bold text-lg">KHANDAQ '25</span>
          </Link>
          <Link
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/admin"
            className="font-bold text-foreground transition-colors hover:text-foreground"
          >
            Programs
          </Link>
        </nav>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <img src="https://res.cloudinary.com/dsth5rkbf/image/upload/v1757926509/logoo_jckvfk.png" alt="KHANDAQ '25 Logo" className="h-8 w-8" />
                <span>KHANDAQ '25</span>
              </Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link
                to="/admin"
                className="font-bold text-foreground"
              >
                Programs
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt="User Avatar" />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold">Manage Programs</h1>
          <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleBulkUpdate(true)} disabled={isBulkUpdating || isLoading}>
                {isBulkUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Publish All
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkUpdate(false)} disabled={isBulkUpdating || isLoading}>
                  {isBulkUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                Unpublish All
              </Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Data Status</TableHead>
                      <TableHead>Publish Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedData.map(item => (
                      <TableRow key={item.code}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.code} • {item.section}</div>
                        </TableCell>
                        <TableCell>
                          {item.status && (
                            <Badge variant="outline" className="capitalize">
                              {item.status.toLowerCase()}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.is_published ? 'default' : 'secondary'}>
                            {item.is_published ? 'Published' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-4">
                            <div className="flex items-center">
                              {isUpdating === item.code && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                              <Switch
                                checked={item.is_published}
                                onCheckedChange={(checked) => handleStatusChange(item.code, checked)}
                                disabled={isUpdating === item.code || isBulkUpdating}
                                aria-label={`Toggle publication status for ${item.name}`}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {combinedData.length === 0 && !isLoading && (
              <div className="text-center py-16 text-muted-foreground">No programs found from data source.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPage;

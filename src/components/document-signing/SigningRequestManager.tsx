import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SigningRequest {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'completed' | 'cancelled';
  created_at: string;
  template_id: string;
  document_templates: {
    name: string;
  };
  signing_request_recipients: Array<{
    id: string;
    recipient_name: string;
    recipient_email: string;
    status: 'pending' | 'signed' | 'declined';
  }>;
}

const statusIcons = {
  draft: Clock,
  sent: Send,
  completed: CheckCircle,
  cancelled: XCircle
};

const statusColors = {
  draft: "secondary",
  sent: "default",
  completed: "default",
  cancelled: "destructive"
} as const;

export function SigningRequestManager() {
  // Fetch signing requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["signing-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signing_requests")
        .select(`
          *,
          document_templates(name),
          signing_request_recipients(id, recipient_name, recipient_email, status)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as SigningRequest[];
    }
  });

  if (isLoading) {
    return <div className="text-center p-8">Loading signing requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Signing Requests</h2>
          <p className="text-muted-foreground">
            Manage and track document signing requests
          </p>
        </div>
        
        <Button className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = statusIcons[request.status];
            const completedCount = request.signing_request_recipients.filter(r => r.status === 'signed').length;
            const totalCount = request.signing_request_recipients.length;
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5" />
                      {request.title}
                    </CardTitle>
                    <Badge 
                      variant={statusColors[request.status]}
                      className={cn(
                        request.status === 'completed' && "bg-green-100 text-green-800 border-green-200"
                      )}
                    >
                      {request.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Template: {request.document_templates.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Created: {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-muted-foreground">
                        Signatures: {completedCount}/{totalCount}
                      </span>
                    </div>
                    
                    {request.signing_request_recipients.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recipients:</h4>
                        <div className="space-y-1">
                          {request.signing_request_recipients.map((recipient) => (
                            <div key={recipient.id} className="flex items-center justify-between text-sm">
                              <span>{recipient.recipient_name} ({recipient.recipient_email})</span>
                              <Badge 
                                variant={
                                  recipient.status === 'declined' ? 'destructive' : 
                                  'secondary'
                                }
                                className={cn(
                                  "text-xs",
                                  recipient.status === 'signed' && "bg-green-100 text-green-800 border-green-200"
                                )}
                              >
                                {recipient.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {request.status === 'draft' && (
                        <Button size="sm">
                          Send Request
                        </Button>
                      )}
                      {request.status === 'sent' && (
                        <Button variant="outline" size="sm">
                          Send Reminder
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center p-12">
            <Send className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Signing Requests</h3>
            <p className="text-muted-foreground mb-4">
              Create your first signing request to send documents for digital signatures
            </p>
            <Button>
              Create First Request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
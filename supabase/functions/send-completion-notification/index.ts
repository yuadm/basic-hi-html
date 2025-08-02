import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CompletionNotificationEmail {
  adminEmail: string;
  signerEmail?: string;
  documentTitle: string;
  signedDocumentUrl: string;
  allSignersNames: string[];
  adminName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      adminEmail, 
      signerEmail,
      documentTitle, 
      signedDocumentUrl,
      allSignersNames,
      adminName = "Administrator"
    }: CompletionNotificationEmail = await req.json();

    console.log("Sending completion notification emails");

    const emails = [];

    // Send notification to admin
    const adminEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": Deno.env.get("BREVO_API_KEY") || "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Document Signing System",
          email: "noreply@yourdomain.com"
        },
        to: [{ email: adminEmail, name: adminName }],
        subject: `Document Completed: ${documentTitle}`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Signing Completed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .success-info { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .signers-list { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✅ Document Fully Signed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">All signatures have been collected</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 10px;">Hello ${adminName},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Great news! The document "<strong>${documentTitle}</strong>" has been successfully signed by all required parties.
              </p>
              
              <div class="success-info">
                <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 16px;">Signing Summary</h3>
                <p style="margin: 0 0 10px 0; color: #047857;"><strong>Document:</strong> ${documentTitle}</p>
                <p style="margin: 0; color: #047857;"><strong>Status:</strong> Completed ✅</p>
              </div>
              
              <div class="signers-list">
                <h4 style="margin: 0 0 10px 0; color: #374151;">Signers:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                  ${allSignersNames.map(name => `<li style="margin: 5px 0;">${name}</li>`).join('')}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signedDocumentUrl}" class="button" style="color: white;">
                  Download Signed Document
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                The signed document is now available for download and has been stored securely in your system.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Document Signing System</p>
            </div>
          </div>
        </body>
        </html>
        `
      })
    });

    if (!adminEmailResponse.ok) {
      throw new Error(`Brevo API error: ${adminEmailResponse.status}`);
    }

    const adminResult = await adminEmailResponse.json();
    emails.push(adminResult);

    // Send copy to signer if email provided
    if (signerEmail) {
      const signerEmailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": Deno.env.get("BREVO_API_KEY") || "",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: {
            name: "Document Signing System",
            email: "noreply@yourdomain.com"
          },
          to: [{ email: signerEmail, name: "Signer" }],
          subject: `Thank you for signing: ${documentTitle}`,
          htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank You for Signing</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
              .content { padding: 40px 30px; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
              .success-info { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Thank You!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your signature has been recorded</p>
              </div>
              
              <div class="content">
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                  Thank you for signing the document "<strong>${documentTitle}</strong>". Your signature has been successfully recorded.
                </p>
                
                <div class="success-info">
                  <p style="margin: 0; color: #047857;">
                    ✅ Your signed copy is attached to this email for your records.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signedDocumentUrl}" class="button" style="color: white;">
                    Download Your Copy
                  </a>
                </div>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">Document Signing System</p>
              </div>
            </div>
          </body>
          </html>
          `
        })
      });

      if (signerEmailResponse.ok) {
        const signerResult = await signerEmailResponse.json();
        emails.push(signerResult);
      }
    }

    console.log("All completion emails sent successfully");

    return new Response(JSON.stringify({ success: true, emails }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-completion-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
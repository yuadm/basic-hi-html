import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SigningRequestEmail {
  recipientEmail: string;
  recipientName: string;
  documentTitle: string;
  signingUrl: string;
  senderName?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      documentTitle, 
      signingUrl, 
      senderName = "Document Signing System",
      message = "Please review and sign the attached document."
    }: SigningRequestEmail = await req.json();

    console.log("Sending signing request email to:", recipientEmail);

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
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
        to: [{ email: recipientEmail, name: recipientName }],
        subject: `Document Signing Request: ${documentTitle}`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Signing Request</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .document-info { background-color: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Document Signature Required</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your digital signature is requested</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-bottom: 10px;">Hello ${recipientName},</h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                ${message}
              </p>
              
              <div class="document-info">
                <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">Document Details:</h3>
                <p style="margin: 0; color: #6b7280;"><strong>Title:</strong> ${documentTitle}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Requested by:</strong> ${senderName}</p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6;">
                To review and sign this document, please click the button below. This link is secure and unique to you.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signingUrl}" class="button" style="color: white;">
                  Review & Sign Document
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                <strong>Important:</strong> This signing link is confidential and should not be shared. 
                If you have any questions about this document, please contact the sender directly.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">This email was sent by the Document Signing System</p>
              <p style="margin: 10px 0 0 0;">If you received this email in error, please ignore it.</p>
            </div>
          </div>
        </body>
        </html>
        `
      })
    });

    if (!emailResponse.ok) {
      throw new Error(`Brevo API error: ${emailResponse.status}`);
    }

    const result = await emailResponse.json();

    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signing-request function:", error);
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
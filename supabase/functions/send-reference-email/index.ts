import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferenceEmailRequest {
  applicantName: string;
  positionAppliedFor: string;
  referenceEmail: string;
  referenceName: string;
  referenceCompany: string;
  referenceAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      applicantName, 
      positionAppliedFor, 
      referenceEmail, 
      referenceName,
      referenceCompany,
      referenceAddress 
    }: ReferenceEmailRequest = await req.json();

    console.log("Sending reference email to:", referenceEmail, "for applicant:", applicantName);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #333; margin-bottom: 5px;">Reference Request</h2>
          <div style="border-bottom: 2px solid #007bff; width: 50px; margin: 0 auto;"></div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #666; font-size: 14px;">Our Address:</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; color: #333;">
            108 Regent Studios<br>
            1 Thane Villas<br>
            London<br>
            N7 7PH
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="font-weight: bold; color: #d32f2f; margin: 0; font-size: 16px;">PRIVATE AND CONFIDENTIAL</p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>${referenceCompany}</strong><br>
            ${referenceAddress || ''}
          </p>
          
          <p style="margin: 20px 0; color: #333;">Dear ${referenceCompany},</p>
          
          <p style="margin: 20px 0; color: #333; line-height: 1.6;">
            <strong>Applicant Name: ${applicantName}</strong>
          </p>
          
          <p style="margin: 20px 0; color: #333; line-height: 1.6;">
            The above named person has applied to us for the post of <strong>${positionAppliedFor}</strong> and has given us your name as a referee. We would be most grateful if you could complete the enclosed reference questionnaire and return it to us.
          </p>
          
          <p style="margin: 20px 0; color: #333; line-height: 1.6;">
            If you would like to include any further supporting comments for your reference please include these with the questionnaire.
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333; margin-top: 0;">Reference Questionnaire</h3>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>1. In what capacity and for how long have you known the applicant?</strong></p>
            <div style="border-bottom: 1px solid #ddd; height: 40px; margin: 10px 0;"></div>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>2. How would you rate their reliability and punctuality?</strong></p>
            <div style="border-bottom: 1px solid #ddd; height: 40px; margin: 10px 0;"></div>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>3. How would you rate their communication skills?</strong></p>
            <div style="border-bottom: 1px solid #ddd; height: 40px; margin: 10px 0;"></div>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>4. Would you employ this person again? If not, why not?</strong></p>
            <div style="border-bottom: 1px solid #ddd; height: 40px; margin: 10px 0;"></div>
          </div>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>5. Any additional comments:</strong></p>
            <div style="border-bottom: 1px solid #ddd; height: 60px; margin: 10px 0;"></div>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Reference provided by:</strong></p>
            <div style="margin: 10px 0;">
              <span style="color: #333;">Name: </span>
              <span style="border-bottom: 1px solid #333; display: inline-block; width: 200px; margin-left: 10px;"></span>
            </div>
            <div style="margin: 10px 0;">
              <span style="color: #333;">Position: </span>
              <span style="border-bottom: 1px solid #333; display: inline-block; width: 200px; margin-left: 10px;"></span>
            </div>
            <div style="margin: 10px 0;">
              <span style="color: #333;">Date: </span>
              <span style="border-bottom: 1px solid #333; display: inline-block; width: 200px; margin-left: 10px;"></span>
            </div>
            <div style="margin: 10px 0;">
              <span style="color: #333;">Signature: </span>
              <span style="border-bottom: 1px solid #333; display: inline-block; width: 200px; margin-left: 10px;"></span>
            </div>
          </div>
        </div>

        <div style="margin: 40px 0 0 0;">
          <p style="margin: 0; color: #333;">Yours faithfully,</p>
          <p style="margin: 10px 0; color: #333; font-weight: bold;">Mohamed Ahmed</p>
        </div>
        
        <div style="border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Please complete and return this reference as soon as possible.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Mohamed Ahmed <noreply@resend.dev>",
      to: [referenceEmail],
      subject: `Reference Request for ${applicantName} - ${positionAppliedFor} Position`,
      html: emailHtml,
    });

    console.log("Reference email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reference-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !subject || !message) {
    throw new Error("All fields are required");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error("Error saving contact message:", error);
    throw new Error("Failed to submit form");
  }

  // Send confirmation email to the user
  const { sendContactConfirmation } = await import("@/lib/mail");
  await sendContactConfirmation(name, email, subject, message);

  return { success: true };
}

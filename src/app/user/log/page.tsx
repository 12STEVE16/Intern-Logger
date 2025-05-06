"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, isAfter, isBefore, subDays, isValid } from "date-fns";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Link from "next/link";

const logSchema = z.object({
  date_worked: z.date().refine(
    (date) => {
      const today = new Date();
      const weekAgo = subDays(today, 7);
      return isValid(date) && !isAfter(date, today) && !isBefore(date, weekAgo);
    },
    {
      message: "Date must be within the last 7 days (including today).",
    }
  ),
  task_title: z.string().min(1, "Task title is required"),
  description: z.string().min(1, "Description is required"),
  hours_worked: z
    .number({ invalid_type_error: "Enter a number" })
    .min(1, "Hours must be at least 1"),
});

type LogFormData = z.infer<typeof logSchema>;

export default function LogPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const logId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const form = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date_worked: new Date(),
      task_title: "",
      description: "",
      hours_worked: 1,
    },
  });

  const { setValue } = form;

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId) return;
      setLoading(true);

      // build token‑aware Supabase client
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      const { data, error } = await supabase
        .from("work_logs")
        .select(
          "id, task_title, description, date_worked, hours_worked, feedback(id)"
        )
        .eq("id", logId)
        .single();

      if (error) {
        console.error(error.message);
      } else if (data) {
        setValue("task_title", data.task_title);
        setValue("description", data.description);
        setValue("date_worked", new Date(data.date_worked));
        setValue("hours_worked", data.hours_worked);
        setFeedbackGiven(
          Array.isArray(data.feedback) && data.feedback.length > 0
        );
      }

      setLoading(false);
    };

    fetchLog();
  }, [logId, setValue, getToken]);

  const onSubmit = async (formData: LogFormData) => {
    if (!user?.id) return;
    setLoading(true);

    // build token‑aware Supabase client
    const token = await getToken();
    const supabase = createSupabaseClient(token || "");

    try {
      if (logId) {
        const { error } = await supabase
          .from("work_logs")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("work_logs").insert({
          ...formData,
          user_id: user.id,
        });
        if (error) throw error;
      }
      router.push("/user/logs");
    } catch (err) {
      console.error("Error saving log:", err);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = feedbackGiven;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {logId ? "Update Log" : "Add New Log"}
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date_worked"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Worked</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isDisabled}
                        >
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          isAfter(date, new Date()) ||
                          isBefore(date, subDays(new Date(), 7))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="task_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title"
                      {...field}
                      disabled={isDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your task"
                      rows={5}
                      {...field}
                      disabled={isDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hours_worked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Worked</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of hours"
                      min={1}
                      {...field}
                      disabled={isDisabled}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              {!isDisabled && (
                <Button type="submit">{logId ? "Update" : "Create"}</Button>
              )}
              <Link
                href="/user/logs"
                className="px-4 py-2 border rounded-md hover:bg-muted text-sm"
              >
                Cancel
              </Link>
            </div>

            {isDisabled && (
              <p className="text-sm text-red-600 mt-4">
                Feedback already given. You cannot edit this log anymore.
              </p>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}

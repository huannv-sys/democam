import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCameraSchema } from "@shared/schema";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Extended schema with URL validation
const addCameraSchema = insertCameraSchema.extend({
  streamUrl: z.string().url("Please enter a valid URL")
});

type AddCameraFormValues = z.infer<typeof addCameraSchema>;

interface AddCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCameraDialog({ open, onOpenChange }: AddCameraDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form definition
  const form = useForm<AddCameraFormValues>({
    resolver: zodResolver(addCameraSchema),
    defaultValues: {
      name: "",
      streamUrl: "",
      motionDetection: true
    }
  });

  // Mutation for adding a camera
  const addCameraMutation = useMutation({
    mutationFn: async (data: AddCameraFormValues) => {
      return apiRequest('POST', '/api/cameras', data);
    },
    onSuccess: async () => {
      setIsSubmitting(false);
      onOpenChange(false);
      form.reset();
      
      // Refresh cameras list
      await queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      
      toast({
        title: "Camera Added",
        description: "New camera has been added successfully.",
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: `Failed to add camera: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Form submission
  const onSubmit = async (data: AddCameraFormValues) => {
    setIsSubmitting(true);
    addCameraMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Camera</DialogTitle>
          <DialogDescription>
            Add a new camera to your surveillance system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camera Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Entrance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="streamUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream URL</FormLabel>
                  <FormControl>
                    <Input placeholder="rtsp://example.com/stream" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motionDetection"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Motion Detection
                    </FormLabel>
                    <FormDescription>
                      Enable alerts when motion is detected.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Camera"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Import that was missing
import { FormDescription } from "@/components/ui/form";

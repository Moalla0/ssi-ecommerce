"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getAdmins } from "@/lib/users";
import { promoteToAdmin, demoteFromAdmin } from "@/app/actions/admin-actions";
import { AdminUser as AdminUserListItem } from "@shared/types";
import { getAllUsers } from "@/lib/users";
import { useEffect, useState } from "react";
import Image from "next/image";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address!" }),
});

const AddUser = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUserListItem[]>([]);

  useEffect(() => {
    const loadAdmins = async () => {
      const list = await getAdmins();
      setAdmins(list);
    };
    loadAdmins();
  }, []);
  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Admin</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={form.handleSubmit(async (values) => {
                setSubmitting(true);
                setResult(null);
                try {
                  const allUsers = await getAllUsers();
                  const targetUser = allUsers.find(
                    (u) => u.email.toLowerCase() === values.email.toLowerCase(),
                  );

                  if (targetUser) {
                    await promoteToAdmin(targetUser.id);
                    setResult("User promoted to admin.");
                    const list = await getAdmins();
                    setAdmins(list);
                  } else {
                    setResult("No user found with that email.");
                  }
                } catch (e: any) {
                  setResult(e?.message || "Failed to promote user.");
                } finally {
                  setSubmitting(false);
                }
              })}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="user@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {result && (
                <div className="text-sm text-muted-foreground">{result}</div>
              )}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Promoting..." : "Promote to Admin"}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
      {/* Admins List */}
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-3">Current Admins</h3>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
          {admins.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No admins found.
            </div>
          ) : (
            admins.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={a.avatar || "/users/1.png"}
                    alt={a.fullName || a.email || a.id}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {a.fullName || a.email || a.id}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.email}
                  </div>
                </div>
                <DowngradeButton
                  adminId={a.id}
                  email={a.email || ""}
                  refresh={async () => setAdmins(await getAdmins())}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </SheetContent>
  );
};

const DowngradeButton = ({
  adminId,
  email,
  refresh,
}: {
  adminId: string;
  email: string;
  refresh: () => Promise<void>;
}) => {
  const { user } = require("@/contexts/AdminAuthContext").useAdminAuth();
  const isSelf =
    user?.email && email && user.email.toLowerCase() === email.toLowerCase();
  const [loading, setLoading] = useState(false);
  if (isSelf) {
    return (
      <button className="text-xs text-muted-foreground" disabled>
        It’s you
      </button>
    );
  }
  return (
    <button
      className="text-xs px-2 py-1 rounded-md border hover:bg-secondary disabled:opacity-50"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await demoteFromAdmin(adminId);
          await refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Downgrading..." : "Downgrade"}
    </button>
  );
};

export default AddUser;

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <EmptyState
        title="Page not found"
        description="This account or page doesn't exist in the current dataset. It may have been removed or the link is out of date."
        action={
          <Link href="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}

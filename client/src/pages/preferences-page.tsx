
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import MainLayout from "@/components/layouts/main-layout";
import PreferenceForm from "@/components/preference-form";

export default function PreferencesPage() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-16">
        <PreferenceForm />
      </div>
    </MainLayout>
  );
}

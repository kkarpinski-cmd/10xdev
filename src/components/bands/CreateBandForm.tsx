import React, { useState } from "react";
import { Music, Plus } from "lucide-react";
import { FormField } from "@/components/auth/FormField";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { BAND_NAME_ERROR } from "@/lib/services/bands";

interface Props {
  serverError?: string | null;
}

export default function CreateBandForm({ serverError }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();

  function validate() {
    const length = name.trim().length;
    if (length < 1 || length > 80) {
      setError(BAND_NAME_ERROR);
      return false;
    }
    setError(undefined);
    return true;
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) {
      event.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/bands" className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField
        id="name"
        label="Band name"
        value={name}
        onChange={(value) => {
          setName(value);
          if (error) setError(undefined);
        }}
        placeholder="Night Shift"
        error={error}
        icon={<Music className="size-4" />}
      />

      <ServerError message={serverError} />

      <SubmitButton pendingText="Creating band..." icon={<Plus className="size-4" />}>
        Create a band
      </SubmitButton>
    </form>
  );
}

import { PageHeader } from "../../ui";
import { FeatureForm } from "../feature-form";
import { createFeatureAction } from "../actions";

export default function NewFeaturePage() {
  return (
    <div>
      <PageHeader title="Add Daily Feature" />
      <FeatureForm action={createFeatureAction} />
    </div>
  );
}

import { PageHeader } from "../../ui";
import { StationForm } from "../station-form";
import { createStationAction } from "../actions";

export default function NewStationPage() {
  return (
    <div>
      <PageHeader title="Add Station" />
      <StationForm action={createStationAction} />
    </div>
  );
}

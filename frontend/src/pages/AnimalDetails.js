import React from "react";
import { useParams, Link } from "react-router-dom";

function AnimalDetails({ pets }) {
  const { id } = useParams();
  const pet = pets.find((p) => p.id.toString() === id);

  if (!pet) {
    return (
      <div className="container py-4">
        <h2>Animal not found</h2>
        <Link to="/dashboard" className="btn btn-secondary mt-3">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-4 mb-4">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white"
          style={{ width: 96, height: 96, background: "#6c757d", fontSize: 28 }}
        >
          {String(pet.name || "U")
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>

        <div>
          <h2 className="mb-0">{pet.name}</h2>
          <div className="text-muted">Owner: {pet.owner || "—"}</div>
          <div className="mt-2">
            <span className="badge bg-info text-dark me-2">
              {pet.appointments ?? 0} appointments
            </span>
            <span className="badge bg-secondary">
              {pet.species} {pet.breed ? `· ${pet.breed}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Details</h5>
          <dl className="row">
            <dt className="col-sm-3">ID</dt>
            <dd className="col-sm-9">{pet.id}</dd>

            <dt className="col-sm-3">Born</dt>
            <dd className="col-sm-9">{pet.born || "—"}</dd>

            <dt className="col-sm-3">Species</dt>
            <dd className="col-sm-9">{pet.species}</dd>

            <dt className="col-sm-3">Breed</dt>
            <dd className="col-sm-9">{pet.breed || "—"}</dd>

            <dt className="col-sm-3">Owner</dt>
            <dd className="col-sm-9">{pet.owner}</dd>
          </dl>
        </div>
      </div>

      <Link to="/dashboard" className="btn btn-outline-primary">
        ← Back to Dashboard
      </Link>
    </div>
  );
}

export default AnimalDetails;

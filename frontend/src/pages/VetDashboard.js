// src/pages/VetDashboard.js
import React, { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

export default function VetDashboard({ pets, setPets }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const firstInputRef = useRef(null);

  const [newPet, setNewPet] = useState({
    name: "",
    species: "",
    breed: "",
    born: "",
    owner: "",
    appointments: 0,
  });

  // focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      // tiny delay to ensure portal content mounted
      const t = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPet((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextId =
      pets && pets.length ? Math.max(...pets.map((p) => p.id)) + 1 : 1;
    const petWithId = {
      ...newPet,
      id: nextId,
    };

    setPets((s) => [...(s || []), petWithId]);
    setShowModal(false);
    setNewPet({
      name: "",
      species: "",
      breed: "",
      born: "",
      owner: "",
      appointments: 0,
    });

    // navigate to new pet details
    navigate(`/animal/${petWithId.id}`);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">Vet Dashboard</h1>
          <small className="text-muted">
            Overview of all registered patients
          </small>
        </div>

        <button
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
          style={{ width: 48, height: 48 }}
          onClick={() => setShowModal(true)}
          aria-label="Add pet"
        >
          <FaPlus />
        </button>
      </div>

      {/* Horizontal cards list */}
      <div
        className="d-flex overflow-auto pb-3"
        style={{ gap: 16, paddingBottom: 12 }}
      >
        {pets && pets.length > 0 ? (
          pets.map((pet) => (
            <Link
              to={`/animal/${pet.id}`}
              key={pet.id}
              className="text-decoration-none"
              style={{ minWidth: 260 }}
            >
              <div
                className="card h-100 shadow-sm"
                style={{ cursor: "pointer" }}
              >
                <div className="card-body d-flex gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: 64,
                      height: 64,
                      background: "#6c757d",
                      flexShrink: 0,
                    }}
                  >
                    <strong style={{ fontSize: 18 }}>
                      {String(pet.name || "U")
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </strong>
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="card-title mb-1">{pet.name}</h5>
                        <div className="text-muted small">
                          {pet.species} · {pet.breed || "—"}
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="badge bg-info text-dark">
                          {pet.appointments ?? 0} appt
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="small text-muted">Born</div>
                      <div>{pet.born || "—"}</div>

                      <div className="small text-muted mt-2">Owner</div>
                      <div>{pet.owner || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                  <small className="text-muted">ID: {pet.id}</small>
                  <small className="text-primary">View details →</small>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="card p-4 text-center" style={{ minWidth: 260 }}>
            <div className="card-body">
              <h5>No pets yet</h5>
              <p className="text-muted small">
                Click the + button to add a patient
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal (portal) */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Pet"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">Add New Pet</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <div className="row gx-3">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name</label>
                <input
                  ref={firstInputRef}
                  className="form-control"
                  name="name"
                  value={newPet.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Species</label>
                <input
                  className="form-control"
                  name="species"
                  value={newPet.species}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Breed</label>
                <input
                  className="form-control"
                  name="breed"
                  value={newPet.breed}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Owner</label>
                <input
                  className="form-control"
                  name="owner"
                  value={newPet.owner}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Date of Birth</label>
                <input
                  className="form-control"
                  name="born"
                  type="date"
                  value={newPet.born}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Appointments</label>
                <input
                  className="form-control"
                  name="appointments"
                  type="number"
                  min="0"
                  value={newPet.appointments}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Pet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

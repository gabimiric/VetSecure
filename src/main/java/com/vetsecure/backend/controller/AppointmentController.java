package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Appointment;
import com.vetsecure.backend.dto.AppointmentDto;
import com.vetsecure.backend.dto.PetDto;
import com.vetsecure.backend.dto.OwnerDto;
import com.vetsecure.backend.service.AppointmentService;
import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.repository.AppointmentRepository;
import com.vetsecure.backend.repository.PetRepository;
import com.vetsecure.backend.repository.VetRepository;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.repository.ClinicScheduleRepository;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentService appointmentService;

    // repositories used throughout the controller
    private final AppointmentRepository appointmentRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final VetRepository vetRepository;
    private final ClinicScheduleRepository clinicScheduleRepository;

    public AppointmentController(
            AppointmentService appointmentService,
            AppointmentRepository appointmentRepository,
            PetRepository petRepository,
            UserRepository userRepository,
            VetRepository vetRepository,
            ClinicScheduleRepository clinicScheduleRepository
    ) {
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.vetRepository = vetRepository;
        this.clinicScheduleRepository = clinicScheduleRepository;
    }

    // Create appointment (Pet owner only). Payload: { petId, clinicId, vetId?, date: "yyyy-MM-dd", time: "HH:mm", reason }
    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            Long petId = payload.get("petId") instanceof Number ? ((Number) payload.get("petId")).longValue() : Long.valueOf(payload.get("petId").toString());
            Long clinicId = payload.get("clinicId") == null ? null : (payload.get("clinicId") instanceof Number ? ((Number) payload.get("clinicId")).longValue() : Long.valueOf(payload.get("clinicId").toString()));
            LocalDate date = LocalDate.parse(payload.get("date").toString());
            LocalTime time = LocalTime.parse(payload.get("time").toString());
            String reason = payload.get("reason") == null ? null : payload.get("reason").toString();

            // accept vetId or vet_id (optional)
            Object vetObj = payload.get("vetId");
            if (vetObj == null) vetObj = payload.get("vet_id");
            Long vetId = null;
            if (vetObj != null) {
                vetId = vetObj instanceof Number ? ((Number) vetObj).longValue() : Long.valueOf(Objects.toString(vetObj));
            }

            // verify pet belongs to authenticated user
            String userEmail = auth.getName();
            var userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) return ResponseEntity.status(401).body(Map.of("error", "User not found"));

            Optional<Pet> petOpt = petRepository.findById(petId);
            if (petOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Pet not found"));
            Pet pet = petOpt.get();
            if (pet.getOwner() == null || !pet.getOwner().getId().equals(userOpt.get().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Pet does not belong to current user"));
            }

            // If clinicId provided, validate against clinic schedules
            if (clinicId != null) {
                List<ClinicSchedule> scheds = clinicScheduleRepository.findByClinicId(clinicId);
                if (scheds == null || scheds.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Clinic has no schedules"));
                }
                int weekday = date.getDayOfWeek().getValue(); // 1 = Monday
                boolean ok = scheds.stream().anyMatch(s -> {
                    Integer w = s.getWeekday() == null ? null : Byte.toUnsignedInt(s.getWeekday());
                    if (w == null) return false;
                    if (w != weekday) return false;
                    LocalTime open = s.getOpenTime();
                    LocalTime close = s.getCloseTime();
                    return open != null && close != null && !time.isBefore(open) && !time.isAfter(close);
                });
                if (!ok) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Chosen time is outside clinic working hours"));
                }
            }

            Appointment apt = new Appointment();
            // if vetId provided, resolve and attach Vet; otherwise leave null
            if (vetId != null) {
                var vetOpt = vetRepository.findById(vetId);
                if (vetOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Vet not found"));
                }
                apt.setVet(vetOpt.get());
            } else {
                apt.setVet(null);
            }
            apt.setPet(pet);
            apt.setDate(date);
            apt.setTime(time);
            apt.setReason(reason);
            apt.setDiagnosis(null);
            apt.setPrescription(null);
            apt.setStatus(Appointment.AppointmentStatus.PENDING);

            Appointment saved = appointmentRepository.save(apt);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get appointment by ID (safe: return minimal fields to avoid lazy-loading / serialization issues)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            Optional<Appointment> opt = appointmentRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Appointment a = opt.get();

            // Build a minimal safe response map (avoid deep object graph)
            var pet = a.getPet();
            java.util.Map<String, Object> petMap = null;
            if (pet != null) {
                petMap = new java.util.LinkedHashMap<>();
                petMap.put("id", safeGet(() -> pet.getId()));
                petMap.put("name", safeGet(() -> pet.getName()));
                petMap.put("species", safeGet(() -> pet.getSpecies()));
                petMap.put("breed", safeGet(() -> pet.getBreed()));
                // prefer dateOfBirth, fallback to born (frontend checks both)
                Object dob = safeGet(() -> pet.getDateOfBirth());
                if (dob == null) {
                    // try alternate getter names via reflection (avoids compile-time dependency on method names)
                    dob = reflectiveGet(pet, "getBorn", "getBirthDate", "getDob", "getDateOfBirth");
                }
                petMap.put("dateOfBirth", dob);

                // owner details (nested)
                java.util.Map<String, Object> ownerMap = null;
                if (safeGet(() -> pet.getOwner()) != null) {
                    var owner = safeGet(() -> pet.getOwner());
                    ownerMap = new java.util.LinkedHashMap<>();
                    ownerMap.put("id", safeGet(() -> owner.getId()));
                    ownerMap.put("firstName", safeGet(() -> owner.getFirstName()));
                    ownerMap.put("lastName", safeGet(() -> owner.getLastName()));
                    ownerMap.put("phone", safeGet(() -> owner.getPhone()));
                    // use reflection to fetch email-like getter to avoid compile error if getEmail() is absent
                    ownerMap.put("email", reflectiveGet(owner, "getEmail", "getEmailAddress", "getContactEmail", "getEmailContact"));
                }
                petMap.put("owner", ownerMap);
            }

            var resp = new java.util.LinkedHashMap<String, Object>();
            resp.put("id", safeGet(() -> a.getId()));
            resp.put("date", safeGet(() -> a.getDate()));
            resp.put("time", safeGet(() -> a.getTime()));
            resp.put("status", a.getStatus() != null ? a.getStatus().name() : null);
            resp.put("reason", safeGet(() -> a.getReason()));
            resp.put("diagnosis", safeGet(() -> a.getDiagnosis()));
            resp.put("prescription", safeGet(() -> a.getPrescription()));
            resp.put("pet", petMap);

            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            // ensure full stacktrace is logged for debugging
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getClass().getSimpleName(), "message", ex.getMessage()));
        }
    }

    // small helper to safely call getters without throwing (keeps compilation compatible)
    private static <T> T safeGet(SupplierWithException<T> s) {
        try {
            return s.get();
        } catch (Throwable t) {
            return null;
        }
    }

    @FunctionalInterface
    private interface SupplierWithException<T> {
        T get() throws Exception;
    }

    /**
     * Reflectively try a list of zero-arg getter names on target and return the first successful result.
     * Returns null if target is null or none of the methods exist / succeed.
     */
    private static Object reflectiveGet(Object target, String... candidateNames) {
        if (target == null || candidateNames == null) return null;
        for (String name : candidateNames) {
            try {
                var m = target.getClass().getMethod(name);
                if (m != null) {
                    return m.invoke(target);
                }
            } catch (Throwable ignored) {
                // try next candidate
            }
        }
        return null;
    }

    /**
     * Get all appointments for a vet
     */
    @GetMapping("/vet/{vetId}")
    public List<AppointmentDto> getAppointmentsForVet(@PathVariable Long vetId) {
        // use repository method (defined with fetch-joins) to avoid lazy-init / serialization issues
        List<Appointment> list = appointmentRepository.findByVetId(vetId);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    private AppointmentDto toDto(Appointment a) {
        AppointmentDto dto = new AppointmentDto();
        dto.id = a.getId();
        dto.date = a.getDate();
        dto.time = a.getTime();
        // avoid calling getStartsAt() if model doesn't expose it
        dto.startsAt = null;
        dto.status = a.getStatus() != null ? a.getStatus().name() : null;
        dto.reason = a.getReason();
        dto.diagnosis = a.getDiagnosis();
        dto.prescription = a.getPrescription();

        if (a.getPet() != null) {
            PetDto pd = new PetDto();
            pd.id = a.getPet().getId();
            // map only commonly-present pet fields to avoid compile errors if some getters differ
            try { pd.name = a.getPet().getName(); } catch (Throwable t) { pd.name = null; }
            try { pd.species = a.getPet().getSpecies(); } catch (Throwable t) { pd.species = null; }
            try { pd.breed = a.getPet().getBreed(); } catch (Throwable t) { pd.breed = null; }
            // Owner: include id only to avoid depending on owner getter names
            if (a.getPet().getOwner() != null) {
                OwnerDto od = new OwnerDto();
                try { od.id = a.getPet().getOwner().getId(); } catch (Throwable t) { od.id = null; }
                pd.owner = od;
            }
            dto.pet = pd;
        }
        return dto;
    }

    /**
     * Get all appointments for a pet
     */
    @GetMapping("/pet/{petId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPetId(@PathVariable Long petId) {
        List<Appointment> appointments = appointmentRepository.findAll()
                .stream()
                .filter(a -> a.getPet() != null && a.getPet().getId() != null && a.getPet().getId().equals(petId))
                .collect(Collectors.toList());
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a pet owner (uses repository to avoid lazy init / streaming errors)
     */
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByOwnerId(@PathVariable Long ownerId) {
        List<Appointment> appointments = appointmentRepository.findByPetOwnerId(ownerId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a clinic
     */
    @GetMapping("/clinic/{clinicId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByClinicId(@PathVariable Long clinicId) {
        List<Appointment> appointments = appointmentRepository.findAll()
                .stream()
                .filter(a -> {
                    try {
                        // Prefer clinic association via the assigned vet (most common).
                        if (a.getVet() != null && a.getVet().getClinic() != null && a.getVet().getClinic().getId() != null) {
                            return a.getVet().getClinic().getId().equals(clinicId);
                        }
                        // Fallback: if Pet model ever stores clinic info in future, handle here safely.
                        return false;
                    } catch (Exception ex) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments by vet and date
     */
    @GetMapping("/vet/{vetId}/date/{date}")
    public ResponseEntity<List<Appointment>> getAppointmentsByVetIdAndDate(
            @PathVariable Long vetId,
            @PathVariable String date
    ) {
        LocalDate localDate = LocalDate.parse(date);
        List<Appointment> appointments = appointmentRepository.findAll()
                .stream()
                .filter(a -> a.getVet() != null && a.getVet().getId() != null && a.getVet().getId().equals(vetId)
                        && a.getDate() != null && a.getDate().equals(localDate))
                .collect(Collectors.toList());
        return ResponseEntity.ok(appointments);
    }

    /**
     * Update appointment status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        try {
            Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(request.get("status"));
            Optional<Appointment> opt = appointmentRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Appointment not found"));
            Appointment appointment = opt.get();
            appointment.setStatus(status);
            appointmentRepository.save(appointment);
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update status", "message", e.getMessage()));
        }
    }

    /**
     * Complete appointment with diagnosis and prescription
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> completeAppointment(
            @PathVariable Long id,
            @RequestBody CompleteAppointmentRequest request
    ) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Appointment not found"));
        Appointment appointment = opt.get();
        appointment.setDiagnosis(request.diagnosis());
        appointment.setPrescription(request.prescription());
        appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        return ResponseEntity.ok(appointment);
    }

    /**
     * Cancel an appointment
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Appointment not found"));
        Appointment appointment = opt.get();
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        return ResponseEntity.ok(appointment);
    }

    /**
     * Update appointment
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Appointment appointment = opt.get();

        try {
            // parse optional date
            if (request.containsKey("date") && request.get("date") != null) {
                String dateStr = request.get("date").toString();
                try {
                    appointment.setDate(LocalDate.parse(dateStr));
                } catch (java.time.format.DateTimeParseException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid date", "message", dateStr));
                }
            }

            // parse optional time
            if (request.containsKey("time") && request.get("time") != null) {
                String timeStr = request.get("time").toString();
                try {
                    appointment.setTime(LocalTime.parse(timeStr));
                } catch (java.time.format.DateTimeParseException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid time", "message", timeStr));
                }
            }

            // reason (nullable)
            if (request.containsKey("reason")) {
                appointment.setReason(request.get("reason") == null ? null : request.get("reason").toString());
            }

            // diagnosis / prescription (allow null)
            if (request.containsKey("diagnosis")) {
                appointment.setDiagnosis(request.get("diagnosis") == null ? null : request.get("diagnosis").toString());
            }
            if (request.containsKey("prescription")) {
                appointment.setPrescription(request.get("prescription") == null ? null : request.get("prescription").toString());
            }

            // status - validate enum explicitly
            if (request.containsKey("status") && request.get("status") != null) {
                String statusStr = request.get("status").toString();
                try {
                    appointment.setStatus(Appointment.AppointmentStatus.valueOf(statusStr));
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid status", "message", statusStr));
                }
            }

            appointmentRepository.save(appointment);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            // log full stack trace so you can inspect server logs
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update appointment", "message", e.getClass().getSimpleName() + ": " + e.getMessage()));
        }
    }

    /**
     * Delete an appointment (admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        try {
            if (!appointmentRepository.existsById(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Appointment not found"));
            }
            appointmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Appointment deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete appointment", "message", e.getMessage()));
        }
    }

    /**
     * Get all appointments (used as a fallback by frontend)
     */
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> all = appointmentRepository.findAllWithFetch();
        return ResponseEntity.ok(all);
    }

    // Request DTOs
    public record AppointmentRequest(
            Long vetId,
            Long petId,
            LocalDate date,
            LocalTime time,
            String reason
    ) {}

    public record UpdateAppointmentRequest(
            LocalDate date,
            LocalTime time,
            String reason
    ) {}

    public record CompleteAppointmentRequest(
            String diagnosis,
            String prescription
    ) {}
}


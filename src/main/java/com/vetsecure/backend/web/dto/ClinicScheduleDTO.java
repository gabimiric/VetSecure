package com.vetsecure.backend.web.dto;

import com.vetsecure.backend.model.ClinicSchedule;

public class ClinicScheduleDTO {
    private Long id;
    private Integer weekday;
    private String openTime;
    private String closeTime;
    private Long clinicId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getWeekday() { return weekday; }
    public void setWeekday(Integer weekday) { this.weekday = weekday; }
    public String getOpenTime() { return openTime; }
    public void setOpenTime(String openTime) { this.openTime = openTime; }
    public String getCloseTime() { return closeTime; }
    public void setCloseTime(String closeTime) { this.closeTime = closeTime; }
    public Long getClinicId() { return clinicId; }
    public void setClinicId(Long clinicId) { this.clinicId = clinicId; }

    public static ClinicScheduleDTO from(ClinicSchedule s) {
        ClinicScheduleDTO d = new ClinicScheduleDTO();
        d.setId(s.getId());
        try {
            // ClinicSchedule.weekday stored as Byte in model
            d.setWeekday(s.getWeekday() == null ? null : Byte.toUnsignedInt(s.getWeekday()));
        } catch (Exception ignored) { d.setWeekday(null); }
        try {
            d.setOpenTime(s.getOpenTime() != null ? s.getOpenTime().toString() : null);
            d.setCloseTime(s.getCloseTime() != null ? s.getCloseTime().toString() : null);
        } catch (Exception ignored) {}
        try {
            d.setClinicId(s.getClinic() != null ? s.getClinic().getId() : null);
        } catch (Exception ignored) {}
        return d;
    }
}
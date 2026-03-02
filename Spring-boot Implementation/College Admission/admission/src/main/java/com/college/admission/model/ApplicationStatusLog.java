package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "ApplicationStatusLog")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer logID;

    @ManyToOne
    @JoinColumn(name = "ApplicationID")
    private Application application;

    private String status;
    private String changedBy;
    private LocalDate changeDate;
}

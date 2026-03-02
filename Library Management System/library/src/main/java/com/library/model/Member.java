// model/Member.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Member")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Member {
    @Id
    @Column(name = "MemberID", length = 50)
    private String memberId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Email", nullable = false)
    private String email;

    @Column(name = "Phone", length = 20)
    private String phone;

    @Column(name = "MembershipDate", nullable = false)
    private LocalDate membershipDate;

    @Column(name = "Status", length = 50, nullable = false)
    private String status;
}
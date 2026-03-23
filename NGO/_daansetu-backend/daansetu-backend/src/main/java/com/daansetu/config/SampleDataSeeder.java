package com.daansetu.config;

import com.daansetu.entity.Campaign;
import com.daansetu.entity.Donation;
import com.daansetu.entity.DonationReceipt;
import com.daansetu.entity.NGO;
import com.daansetu.entity.Payment;
import com.daansetu.entity.PickupRequest;
import com.daansetu.entity.TaskAssignment;
import com.daansetu.entity.User;
import com.daansetu.entity.Volunteer;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.DonationStatus;
import com.daansetu.enums.DonationType;
import com.daansetu.enums.PaymentMethod;
import com.daansetu.enums.PaymentStatus;
import com.daansetu.enums.PickupStatus;
import com.daansetu.enums.TaskStatus;
import com.daansetu.enums.UserRole;
import com.daansetu.enums.VolunteerStatus;
import com.daansetu.repository.CampaignRepository;
import com.daansetu.repository.DonationReceiptRepository;
import com.daansetu.repository.DonationRepository;
import com.daansetu.repository.NGORepository;
import com.daansetu.repository.PaymentRepository;
import com.daansetu.repository.PickupRequestRepository;
import com.daansetu.repository.TaskAssignmentRepository;
import com.daansetu.repository.UserRepository;
import com.daansetu.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SampleDataSeeder {

    private static final String DEFAULT_PASSWORD = "password123";

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final NGORepository ngoRepository;
    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    private final PaymentRepository paymentRepository;
    private final DonationReceiptRepository donationReceiptRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final VolunteerRepository volunteerRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;

    @Value("${app.seed.sample-data:true}")
    private boolean sampleDataSeedEnabled;

    @Bean
    public CommandLineRunner seedSampleDataIfMissing() {
        return args -> {
            if (!sampleDataSeedEnabled) {
                log.info("Sample data seeding disabled (app.seed.sample-data=false)");
                return;
            }

            User adminUser = ensureUser(
                    "admin@daansetu.org",
                    "System Admin",
                    UserRole.ADMIN,
                    "+919100000001",
                    "Mumbai",
                    "DaanSetu HQ, Mumbai"
            );

            User ngoUser = ensureUser(
                    "ngo@daansetu.org",
                    "Hope Foundation",
                    UserRole.NGO,
                    "+919100000002",
                    "Mumbai",
                    "Andheri West, Mumbai"
            );

            User donorUser = ensureUser(
                    "donor@daansetu.org",
                    "Rahul Donor",
                    UserRole.DONOR,
                    "+919100000003",
                    "Pune",
                    "Kothrud, Pune"
            );

            User donorUserTwo = ensureUser(
                    "donor2@daansetu.org",
                    "Priya Donor",
                    UserRole.DONOR,
                    "+919100000004",
                    "Nashik",
                    "College Road, Nashik"
            );

            User volunteerUser = ensureUser(
                    "volunteer@daansetu.org",
                    "Aman Volunteer",
                    UserRole.VOLUNTEER,
                    "+919100000005",
                    "Mumbai",
                    "Bandra East, Mumbai"
            );

            NGO ngo = ensureNgo(ngoUser);
            ensurePublicNgoLocations();
            Volunteer volunteer = ensureVolunteer(volunteerUser, ngo);

            if (campaignRepository.count() == 0) {
                seedCampaigns(adminUser, ngo);
                log.info("Seeded default campaigns");
            }

            List<Campaign> campaigns = campaignRepository.findAll();
            if (campaigns.isEmpty()) {
                log.warn("No campaigns available for seeding donations/pickups");
                return;
            }

            if (donationRepository.count() == 0) {
                seedDonations(campaigns, donorUser, donorUserTwo);
                log.info("Seeded default donations, payments, and receipts");
            }

            if (pickupRequestRepository.count() == 0) {
                seedPickups(campaigns, donorUser, volunteer);
                log.info("Seeded default pickup requests and volunteer tasks");
            }

            recomputeCampaignProgress();
        };
    }

    private User ensureUser(
            String email,
            String name,
            UserRole role,
            String phone,
            String city,
            String address
    ) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .name(name)
                                .email(email.toLowerCase())
                                .phone(phone)
                                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                                .address(address)
                                .city(city)
                                .role(role)
                                .active(true)
                                .emailVerified(true)
                                .phoneVerified(true)
                                .build()
                ));
    }

    private NGO ensureNgo(User ngoUser) {
        return ngoRepository.findByEmail(ngoUser.getEmail())
                .orElseGet(() -> ngoRepository.save(
                        NGO.builder()
                                .ngoName("Hope Foundation")
                                .email(ngoUser.getEmail())
                                .phone(ngoUser.getPhone())
                                .address("Andheri West, Mumbai")
                                .city("Mumbai")
                                .state("Maharashtra")
                                .description("Community support NGO for food, education, and relief")
                                .registrationNumber("REG-HOPE-2024-001")
                                .panNumber("ABCDE1234F")
                                .section80gNumber("80G-HOPE-2024")
                                .verified(true)
                                .latitude(19.1197)
                                .longitude(72.8468)
                                .build()
                ));
    }

    private void ensurePublicNgoLocations() {
        ensureMapNgo(
                "Education For All Foundation",
                "ngo.education@daansetu.org",
                "+919200000101",
                "42, Andheri West, Mumbai 400058",
                "Mumbai",
                "Maharashtra",
                "Education support NGO for underprivileged children.",
                "REG-EDU-2024-001",
                "AAATE1201F",
                "80G-EDU-2024",
                19.0760,
                72.8777
        );

        ensureMapNgo(
                "Rapid Relief India",
                "ngo.relief@daansetu.org",
                "+919200000102",
                "15, Connaught Place, New Delhi 110001",
                "New Delhi",
                "Delhi",
                "Disaster response and emergency shelter support.",
                "REG-REL-2024-002",
                "AAATR1202F",
                "80G-REL-2024",
                28.6139,
                77.2090
        );

        ensureMapNgo(
                "Feed India Movement",
                "ngo.feed@daansetu.org",
                "+919200000103",
                "78, MG Road, Bangalore 560001",
                "Bangalore",
                "Karnataka",
                "Hunger relief and daily meal program operations.",
                "REG-FED-2024-003",
                "AAATF1203F",
                "80G-FED-2024",
                12.9716,
                77.5946
        );

        ensureMapNgo(
                "WaterAid India",
                "ngo.wateraid@daansetu.org",
                "+919200000104",
                "23, T Nagar, Chennai 600017",
                "Chennai",
                "Tamil Nadu",
                "Clean water and sanitation access projects.",
                "REG-WAT-2024-004",
                "AAATW1204F",
                "80G-WAT-2024",
                13.0827,
                80.2707
        );

        ensureMapNgo(
                "Health First NGO",
                "ngo.health@daansetu.org",
                "+919200000105",
                "56, Park Street, Kolkata 700016",
                "Kolkata",
                "West Bengal",
                "Healthcare outreach and medicine access for rural areas.",
                "REG-HEA-2024-005",
                "AAATH1205F",
                "80G-HEA-2024",
                22.5726,
                88.3639
        );

        ensureMapNgo(
                "Green Earth Initiative",
                "ngo.green@daansetu.org",
                "+919200000106",
                "89, CG Road, Ahmedabad 380006",
                "Ahmedabad",
                "Gujarat",
                "Environmental restoration and tree plantation drives.",
                "REG-GRE-2024-006",
                "AAATG1206F",
                "80G-GRE-2024",
                23.0225,
                72.5714
        );

        ensureMapNgo(
                "Warmth Foundation",
                "ngo.warmth@daansetu.org",
                "+919200000107",
                "34, MI Road, Jaipur 302001",
                "Jaipur",
                "Rajasthan",
                "Winter relief and clothing support for vulnerable families.",
                "REG-WAR-2024-007",
                "AAATW1207F",
                "80G-WAR-2024",
                26.9124,
                75.7873
        );

        ensureMapNgo(
                "Women Empowerment Trust",
                "ngo.women@daansetu.org",
                "+919200000108",
                "45, Banjara Hills, Hyderabad 500034",
                "Hyderabad",
                "Telangana",
                "Women skill development and livelihood programs.",
                "REG-WEM-2024-008",
                "AAATW1208F",
                "80G-WEM-2024",
                17.3850,
                78.4867
        );
    }

    private NGO ensureMapNgo(
            String ngoName,
            String email,
            String phone,
            String address,
            String city,
            String state,
            String description,
            String registrationNumber,
            String panNumber,
            String section80gNumber,
            Double latitude,
            Double longitude
    ) {
        NGO ngo = ngoRepository.findByEmail(email).orElseGet(NGO::new);

        if (ngo.getEmail() == null || ngo.getEmail().isBlank()) {
            ngo.setEmail(email);
        }
        if (ngo.getNgoName() == null || ngo.getNgoName().isBlank()) {
            ngo.setNgoName(ngoName);
        }
        if (ngo.getPhone() == null || ngo.getPhone().isBlank()) {
            ngo.setPhone(phone);
        }
        if (ngo.getAddress() == null || ngo.getAddress().isBlank()) {
            ngo.setAddress(address);
        }
        if (ngo.getCity() == null || ngo.getCity().isBlank()) {
            ngo.setCity(city);
        }
        if (ngo.getState() == null || ngo.getState().isBlank()) {
            ngo.setState(state);
        }
        if (ngo.getDescription() == null || ngo.getDescription().isBlank()) {
            ngo.setDescription(description);
        }
        if (ngo.getRegistrationNumber() == null || ngo.getRegistrationNumber().isBlank()) {
            ngo.setRegistrationNumber(registrationNumber);
        }
        if (ngo.getPanNumber() == null || ngo.getPanNumber().isBlank()) {
            ngo.setPanNumber(panNumber);
        }
        if (ngo.getSection80gNumber() == null || ngo.getSection80gNumber().isBlank()) {
            ngo.setSection80gNumber(section80gNumber);
        }
        if (ngo.getLatitude() == null) {
            ngo.setLatitude(latitude);
        }
        if (ngo.getLongitude() == null) {
            ngo.setLongitude(longitude);
        }
        ngo.setVerified(true);

        return ngoRepository.save(ngo);
    }

    private Volunteer ensureVolunteer(User volunteerUser, NGO ngo) {
        return volunteerRepository.findByUserUserId(volunteerUser.getUserId())
                .orElseGet(() -> volunteerRepository.save(
                        Volunteer.builder()
                                .user(volunteerUser)
                                .ngo(ngo)
                                .volunteerStatus(VolunteerStatus.ACTIVE)
                                .hoursVolunteered(24)
                                .tasksCompleted(5)
                                .build()
                ));
    }

    private void seedCampaigns(User adminUser, NGO ngo) {
        Campaign c1 = Campaign.builder()
                .ngo(ngo)
                .admin(adminUser)
                .title("Disaster Relief Fund")
                .description("Support emergency food and shelter kits for affected families.")
                .donationType(DonationType.MONEY)
                .targetAmount(new BigDecimal("200000.00"))
                .collectedAmount(BigDecimal.ZERO)
                .startDate(LocalDate.now().minusDays(20))
                .endDate(LocalDate.now().plusDays(90))
                .campaignStatus(CampaignStatus.ACTIVE)
                .city("Mumbai")
                .state("Maharashtra")
                .donorsCount(0)
                .build();

        Campaign c2 = Campaign.builder()
                .ngo(ngo)
                .admin(adminUser)
                .title("Education Support Drive")
                .description("Help provide books and school kits to children.")
                .donationType(DonationType.MONEY)
                .targetAmount(new BigDecimal("150000.00"))
                .collectedAmount(BigDecimal.ZERO)
                .startDate(LocalDate.now().minusDays(15))
                .endDate(LocalDate.now().plusDays(75))
                .campaignStatus(CampaignStatus.ACTIVE)
                .city("Pune")
                .state("Maharashtra")
                .donorsCount(0)
                .build();

        Campaign c3 = Campaign.builder()
                .ngo(ngo)
                .admin(adminUser)
                .title("Food Donation Drive")
                .description("Collect and distribute food essentials to families in need.")
                .donationType(DonationType.FOOD)
                .targetAmount(new BigDecimal("100000.00"))
                .collectedAmount(BigDecimal.ZERO)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(60))
                .campaignStatus(CampaignStatus.ACTIVE)
                .city("Nashik")
                .state("Maharashtra")
                .donorsCount(0)
                .build();

        campaignRepository.saveAll(List.of(c1, c2, c3));
    }

    private void seedDonations(List<Campaign> campaigns, User donorOne, User donorTwo) {
        Campaign first = campaigns.get(0);
        Campaign second = campaigns.size() > 1 ? campaigns.get(1) : first;

        createMonetaryDonation(first, donorOne, new BigDecimal("3500.00"), PaymentMethod.UPI, "Seed donation #1");
        createMonetaryDonation(second, donorOne, new BigDecimal("2000.00"), PaymentMethod.CARD, "Seed donation #2");
        createMonetaryDonation(first, donorTwo, new BigDecimal("5000.00"), PaymentMethod.UPI, "Seed donation #3");
    }

    private void createMonetaryDonation(
            Campaign campaign,
            User donor,
            BigDecimal amount,
            PaymentMethod paymentMethod,
            String message
    ) {
        Donation donation = donationRepository.save(
                Donation.builder()
                        .campaign(campaign)
                        .user(donor)
                        .donationType(DonationType.MONEY)
                        .amount(amount)
                        .donationStatus(DonationStatus.COMPLETED)
                        .message(message)
                        .anonymous(false)
                        .build()
        );

        paymentRepository.save(
                Payment.builder()
                        .donation(donation)
                        .paymentMethod(paymentMethod)
                        .transactionId("SEED-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .amount(amount)
                        .paymentStatus(PaymentStatus.SUCCESS)
                        .build()
        );

        donationReceiptRepository.save(
                DonationReceipt.builder()
                        .donation(donation)
                        .receiptNumber("REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .build()
        );
    }

    private void seedPickups(List<Campaign> campaigns, User donor, Volunteer volunteer) {
        Campaign physicalCampaign = campaigns.stream()
                .filter(c -> c.getDonationType() == DonationType.FOOD
                        || c.getDonationType() == DonationType.CLOTHES
                        || c.getDonationType() == DonationType.BOOKS)
                .findFirst()
                .orElse(campaigns.get(0));

        Donation pickupDonation = donationRepository.save(
                Donation.builder()
                        .campaign(physicalCampaign)
                        .user(donor)
                        .donationType(DonationType.FOOD)
                        .amount(new BigDecimal("1.00"))
                        .donationStatus(DonationStatus.COMPLETED)
                        .message("Physical pickup donation")
                        .anonymous(false)
                        .build()
        );

        PickupRequest pickup = pickupRequestRepository.save(
                PickupRequest.builder()
                        .donation(pickupDonation)
                        .donorAddress("Kothrud, Pune")
                        .pickupDate(LocalDate.now().plusDays(2))
                        .timeSlot("2:00 PM - 4:00 PM")
                        .pickupStatus(PickupStatus.SCHEDULED)
                        .contactPhone(donor.getPhone())
                        .notes("Pickup food kits from gate")
                        .latitude(18.5074)
                        .longitude(73.8077)
                        .build()
        );

        if (taskAssignmentRepository.count() == 0) {
            taskAssignmentRepository.save(
                    TaskAssignment.builder()
                            .pickupRequest(pickup)
                            .volunteer(volunteer)
                            .taskStatus(TaskStatus.ASSIGNED)
                            .description("Pickup scheduled donation from donor location")
                            .build()
            );
        }
    }

    private void recomputeCampaignProgress() {
        List<Campaign> campaigns = campaignRepository.findAll();
        List<Donation> donations = donationRepository.findAll();

        for (Campaign campaign : campaigns) {
            BigDecimal total = BigDecimal.ZERO;
            Set<Long> donorIds = new HashSet<>();

            for (Donation donation : donations) {
                if (donation.getCampaign() == null || donation.getCampaign().getCampaignId() == null) {
                    continue;
                }
                if (!donation.getCampaign().getCampaignId().equals(campaign.getCampaignId())) {
                    continue;
                }
                if (donation.getDonationStatus() != DonationStatus.COMPLETED) {
                    continue;
                }
                total = total.add(donation.getAmount() == null ? BigDecimal.ZERO : donation.getAmount());
                if (donation.getUser() != null && donation.getUser().getUserId() != null) {
                    donorIds.add(donation.getUser().getUserId());
                }
            }

            campaign.setCollectedAmount(total);
            campaign.setDonorsCount(donorIds.size());
            campaignRepository.save(campaign);
        }
    }
}

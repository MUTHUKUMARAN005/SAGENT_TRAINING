// repository/CatalogEntryRepository.java
package com.library.repository;

import com.library.model.CatalogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CatalogEntryRepository extends JpaRepository<CatalogEntry, String> {}
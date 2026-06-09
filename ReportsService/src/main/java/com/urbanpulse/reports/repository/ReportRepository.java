package com.urbanpulse.reports.repository;

import com.urbanpulse.reports.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    @Query(value = """
            SELECT * FROM reports
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Report> findFirstPageAll(@Param("limit") int limit);

    @Query(value = """
            SELECT * FROM reports
            WHERE status = :status
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Report> findFirstPageByStatus(@Param("status") String status, @Param("limit") int limit);

    @Query(value = """
            SELECT * FROM reports
            WHERE (created_at < :cursorTime OR (created_at = :cursorTime AND id < CAST(:cursorId AS uuid)))
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Report> findNextPageAll(
            @Param("cursorTime") OffsetDateTime cursorTime,
            @Param("cursorId") String cursorId,
            @Param("limit") int limit
    );

    @Query(value = """
            SELECT * FROM reports
            WHERE status = :status
            AND (created_at < :cursorTime OR (created_at = :cursorTime AND id < CAST(:cursorId AS uuid)))
            ORDER BY created_at DESC, id DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Report> findNextPageByStatus(
            @Param("status") String status,
            @Param("cursorTime") OffsetDateTime cursorTime,
            @Param("cursorId") String cursorId,
            @Param("limit") int limit
    );
}

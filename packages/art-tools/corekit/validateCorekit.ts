import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface CorekitValidationError {
  code: string;
  message: string;
  path?: string;
}

export interface CorekitValidationResult {
  valid: boolean;
  errors: CorekitValidationError[];
  summary: {
    activeReferenceCount: number;
    supersededReferenceCount: number;
    legacyExceptionCount: number;
    verifiedManifestAssets: number;
    verifiedTiledMaps: number;
  };
}

export interface ProductionJobSpec {
  jobId: string;
  referenceId: string;
  profileId: string;
  generationProvider: string;
  generationMethod: string;
  postProcessingSteps?: string[];
  sourceFiles: Array<{ path: string; sha256: string }>;
}

function sha256File(absPath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

export function deriveRuntimeAnimationProjection(
  animProfileData: Record<string, any>,
  sourceAnimationProfileSha256: string
): Record<string, any> {
  const profiles: Record<string, Record<string, any>> = {};
  for (const [pid, prof] of Object.entries<Record<string, any>>(animProfileData.profiles ?? {})) {
    if (!Array.isArray(prof.supportedStates) || !Array.isArray(prof.supportedDirections)) {
      continue;
    }
    const entry: Record<string, any> = {
      kind: prof.kind,
      frameWidth: prof.frameWidth,
      frameHeight: prof.frameHeight,
      supportedStates: prof.supportedStates,
      supportedDirections: prof.supportedDirections
    };
    if (typeof prof.sheetWidth === "number") {
      entry.sheetWidth = prof.sheetWidth;
    }
    if (typeof prof.sheetHeight === "number") {
      entry.sheetHeight = prof.sheetHeight;
    }
    if (typeof prof.columns === "number") {
      entry.columns = prof.columns;
    }
    if (typeof prof.rows === "number") {
      entry.rows = prof.rows;
    }
    if (prof.stateLayout && typeof prof.stateLayout === "object") {
      entry.stateLayout = prof.stateLayout;
    }
    if (prof.fallbackPolicy && typeof prof.fallbackPolicy === "object") {
      entry.fallbackPolicy = prof.fallbackPolicy;
    }
    profiles[pid] = entry;
  }

  return {
    schemaVersion: "1.0.0",
    sourceCatalog: "assets/corekit/v01b/catalog.json",
    sourceAnimationProfile: "assets/corekit/v01b/profiles/animation.json",
    sourceAnimationProfileSha256,
    profiles,
    spriteBindings: animProfileData.spriteBindings ?? {}
  };
}

export function assertSafeRepoPath(
  rootDir: string,
  relPath: string,
  errors: CorekitValidationError[],
  contextLabel: string
): string | null {
  if (typeof relPath !== "string" || relPath.trim().length === 0) {
    errors.push({
      code: "INVALID_PATH",
      message: `${contextLabel}: path must be a non-empty string`,
      path: String(relPath)
    });
    return null;
  }
  if (
    relPath.startsWith("/") ||
    relPath.startsWith("\\") ||
    /^[a-zA-Z]:/.test(relPath) ||
    relPath.includes("\\")
  ) {
    errors.push({
      code: "NON_PORTABLE_OR_ABSOLUTE_PATH",
      message: `${contextLabel}: absolute or backslash path is forbidden (${relPath})`,
      path: relPath
    });
    return null;
  }
  const segments = relPath.split("/");
  if (segments.some((seg) => seg === ".." || seg === "." || seg.length === 0)) {
    errors.push({
      code: "PATH_TRAVERSAL_FORBIDDEN",
      message: `${contextLabel}: path traversal or dot segment is forbidden (${relPath})`,
      path: relPath
    });
    return null;
  }

  const rootResolved = path.resolve(rootDir);
  const targetAbs = path.resolve(rootResolved, relPath);
  const relFromRoot = path.relative(rootResolved, targetAbs);
  if (relFromRoot.startsWith("..") || path.isAbsolute(relFromRoot)) {
    errors.push({
      code: "PATH_ESCAPE_FORBIDDEN",
      message: `${contextLabel}: resolved path escapes repository root (${relPath})`,
      path: relPath
    });
    return null;
  }

  let cur = rootResolved;
  for (const seg of segments) {
    cur = path.join(cur, seg);
    if (fs.existsSync(cur)) {
      const lstat = fs.lstatSync(cur);
      if (lstat.isSymbolicLink()) {
        const realRoot = fs.realpathSync(rootResolved);
        const realTarget = fs.realpathSync(cur);
        const realRel = path.relative(realRoot, realTarget);
        if (realRel.startsWith("..") || path.isAbsolute(realRel)) {
          errors.push({
            code: "SYMLINK_ESCAPE_FORBIDDEN",
            message: `${contextLabel}: symlink escapes repository root (${relPath})`,
            path: relPath
          });
          return null;
        }
      }
    }
  }

  return targetAbs;
}

export function resolveActiveCorekitReference(
  catalog: Record<string, any>,
  referenceId: string
): Record<string, any> {
  const refs = Array.isArray(catalog.references) ? catalog.references : [];
  const activeMatches = refs.filter(
    (r: Record<string, any>) => r.referenceId === referenceId && r.active === true
  );
  if (activeMatches.length > 1) {
    throw new Error(
      `DUPLICATE_ACTIVE_VERSION: Multiple active references found for ${referenceId}`
    );
  }
  if (activeMatches.length === 0) {
    const superseded = (catalog.supersededReferences ?? []).find(
      (r: Record<string, any>) => r.referenceId === referenceId
    );
    if (superseded) {
      throw new Error(
        `SUPERSEDED_REFERENCE_FORBIDDEN: ${referenceId} exists only in supersededReferences and cannot be used as an active master`
      );
    }
    throw new Error(
      `MISSING_ACTIVE_REFERENCE: No active Core Kit reference found for ${referenceId}`
    );
  }
  const resolved = activeMatches[0];
  if (
    resolved.role !== "master_reference" ||
    resolved.creativeApprovalState !== "HUMAN_APPROVED"
  ) {
    throw new Error(
      `NON_HUMAN_APPROVED_ACTIVE_MASTER: ${referenceId} has role=${resolved.role} state=${resolved.creativeApprovalState} (must be master_reference + HUMAN_APPROVED)`
    );
  }
  const ledgerEntries = Array.isArray(catalog.approvalLedger) ? catalog.approvalLedger : [];
  const matchingLedger = ledgerEntries.find(
    (entry: Record<string, any>) =>
      entry.decisionId === resolved.approvalRecordId &&
      entry.state === "HUMAN_APPROVED" &&
      Boolean(entry.date) &&
      Boolean(entry.scope) &&
      Boolean(entry.approvedBy)
  );
  if (
    !resolved.approvalRecordId ||
    !matchingLedger ||
    !resolved.approvalScope ||
    !resolved.approvedDate ||
    !resolved.approvalSource
  ) {
    throw new Error(
      `MISSING_APPROVAL_RECORD: ${referenceId} lacks a valid HUMAN_APPROVED approvalLedger record for ${String(resolved.approvalRecordId)}`
    );
  }
  return resolved;
}

export function validateProductionJobSpec(
  catalog: Record<string, any>,
  job: ProductionJobSpec,
  options?: { rootDir?: string; knownProfileIds?: Set<string> }
): CorekitValidationError[] {
  const errors: CorekitValidationError[] = [];
  try {
    resolveActiveCorekitReference(catalog, job.referenceId);
  } catch (err) {
    errors.push({
      code: "UNKNOWN_OR_INACTIVE_REFERENCE",
      message: err instanceof Error ? err.message : String(err),
      path: job.referenceId
    });
  }

  const knownProfiles = new Set<string>(options?.knownProfileIds ?? []);
  for (const profMeta of Object.values<Record<string, any>>(catalog.profiles ?? {})) {
    if (typeof profMeta?.profileGroupId === "string") {
      knownProfiles.add(profMeta.profileGroupId);
    }
  }
  for (const ref of catalog.references ?? []) {
    if (typeof ref?.profileId === "string") {
      knownProfiles.add(ref.profileId);
    }
  }
  if (!job.profileId || !knownProfiles.has(job.profileId)) {
    errors.push({
      code: "UNKNOWN_PRODUCTION_JOB_PROFILE",
      message: `Job '${job.jobId}' references unknown profileId '${job.profileId}'`,
      path: job.profileId
    });
  }

  const allowedProviders: string[] = catalog.allowedNativeGenerationProviders ?? [];
  if (!allowedProviders.includes(job.generationProvider)) {
    errors.push({
      code: "DISALLOWED_GENERATION_PROVIDER",
      message: `Job '${job.jobId}' uses disallowed generationProvider '${job.generationProvider}'`,
      path: job.jobId
    });
  }

  const forbiddenMethods: string[] = catalog.forbiddenProceduralMethods ?? [];
  const combinedMethods = [job.generationMethod, ...(job.postProcessingSteps ?? [])].join(" ");
  for (const forbidden of forbiddenMethods) {
    if (combinedMethods.toLowerCase().includes(forbidden.toLowerCase())) {
      errors.push({
        code: "FORBIDDEN_PROCEDURAL_METHOD",
        message: `Job '${job.jobId}' declares forbidden procedural method '${forbidden}'`,
        path: job.jobId
      });
    }
  }

  const catalogKnownFileHashes = new Map<string, string>();
  for (const ref of catalog.references ?? []) {
    for (const f of [...(ref.masterFiles ?? []), ...(ref.sourceLineage ?? [])]) {
      if (typeof f?.path === "string" && typeof f?.sha256 === "string") {
        catalogKnownFileHashes.set(f.path, f.sha256);
      }
    }
  }

  if (!Array.isArray(job.sourceFiles) || job.sourceFiles.length === 0) {
    errors.push({
      code: "MISSING_PRODUCTION_SOURCE_FILES",
      message: `Job '${job.jobId}' must declare at least one native source file`,
      path: job.jobId
    });
  } else {
    for (const sf of job.sourceFiles) {
      if (!sf.path || typeof sf.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(sf.sha256)) {
        errors.push({
          code: "INVALID_PRODUCTION_SOURCE_HASH",
          message: `Job '${job.jobId}' source '${sf.path}' has invalid sha256`,
          path: sf.path
        });
        continue;
      }
      if (options?.rootDir) {
        const sfAbs = assertSafeRepoPath(
          options.rootDir,
          sf.path,
          errors,
          `job.${job.jobId}.sourceFiles`
        );
        if (!sfAbs || !fs.existsSync(sfAbs)) {
          errors.push({
            code: "MISSING_PRODUCTION_SOURCE_FILE",
            message: `Job '${job.jobId}' references missing source file '${sf.path}'`,
            path: sf.path
          });
        } else if (sha256File(sfAbs) !== sf.sha256) {
          errors.push({
            code: "PRODUCTION_SOURCE_HASH_MISMATCH",
            message: `Job '${job.jobId}' source '${sf.path}' sha256 mismatch`,
            path: sf.path
          });
        }
      } else {
        if (
          sf.path.startsWith("/") ||
          sf.path.startsWith("\\") ||
          /^[a-zA-Z]:/.test(sf.path) ||
          sf.path.includes("\\") ||
          sf.path.split("/").some((seg) => seg === ".." || seg === "." || seg.length === 0)
        ) {
          errors.push({
            code: "NON_PORTABLE_OR_ABSOLUTE_PATH",
            message: `Job '${job.jobId}' source path '${sf.path}' is not a safe portable repo path`,
            path: sf.path
          });
          continue;
        }
        const catalogSha = catalogKnownFileHashes.get(sf.path);
        if (!catalogSha) {
          errors.push({
            code: "MISSING_PRODUCTION_SOURCE_FILE",
            message: `Job '${job.jobId}' references unverified or missing source file '${sf.path}'`,
            path: sf.path
          });
        } else if (catalogSha !== sf.sha256) {
          errors.push({
            code: "PRODUCTION_SOURCE_HASH_MISMATCH",
            message: `Job '${job.jobId}' source '${sf.path}' sha256 mismatch against catalog lineage`,
            path: sf.path
          });
        }
      }
    }
  }

  return errors;
}

export function validateCorekitRepository(options: {
  rootDir: string;
  catalogRelPath?: string;
  manifestRelPath?: string;
  provenanceRelPath?: string;
}): CorekitValidationResult {
  const rootDir = path.resolve(options.rootDir);
  const catalogRelPath = options.catalogRelPath ?? "assets/corekit/v01b/catalog.json";
  const manifestRelPath = options.manifestRelPath ?? "assets/manifest.json";
  const provenanceRelPath = options.provenanceRelPath ?? "assets/provenance.json";
  const errors: CorekitValidationError[] = [];

  const catalogAbs = assertSafeRepoPath(rootDir, catalogRelPath, errors, "catalogRelPath");
  const manifestAbs = assertSafeRepoPath(rootDir, manifestRelPath, errors, "manifestRelPath");
  const provenanceAbs = assertSafeRepoPath(rootDir, provenanceRelPath, errors, "provenanceRelPath");

  if (!catalogAbs || !fs.existsSync(catalogAbs)) {
    errors.push({
      code: "MISSING_COREKIT_CATALOG",
      message: `Missing Core Kit catalog at ${catalogRelPath}`,
      path: catalogRelPath
    });
    return {
      valid: false,
      errors,
      summary: {
        activeReferenceCount: 0,
        supersededReferenceCount: 0,
        legacyExceptionCount: 0,
        verifiedManifestAssets: 0,
        verifiedTiledMaps: 0
      }
    };
  }

  if (!manifestAbs || !fs.existsSync(manifestAbs)) {
    errors.push({
      code: "MISSING_MANIFEST",
      message: `Missing manifest at ${manifestRelPath}`,
      path: manifestRelPath
    });
  }
  if (!provenanceAbs || !fs.existsSync(provenanceAbs)) {
    errors.push({
      code: "MISSING_PROVENANCE",
      message: `Missing provenance at ${provenanceRelPath}`,
      path: provenanceRelPath
    });
  }
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      summary: {
        activeReferenceCount: 0,
        supersededReferenceCount: 0,
        legacyExceptionCount: 0,
        verifiedManifestAssets: 0,
        verifiedTiledMaps: 0
      }
    };
  }

  const catalog = JSON.parse(fs.readFileSync(catalogAbs!, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestAbs!, "utf8"));
  const provenance = JSON.parse(fs.readFileSync(provenanceAbs!, "utf8"));

  const approvalIds = new Set<string>();
  const humanApprovedDecisionIds = new Set<string>();
  for (const entry of catalog.approvalLedger ?? []) {
    if (!entry.decisionId || !entry.date || !entry.scope || !entry.approvedBy || !entry.state) {
      errors.push({
        code: "INVALID_APPROVAL_LEDGER_ENTRY",
        message: `Approval ledger entry missing required fields (${JSON.stringify(entry)})`
      });
      continue;
    }
    if (approvalIds.has(entry.decisionId)) {
      errors.push({
        code: "DUPLICATE_APPROVAL_DECISION_ID",
        message: `Duplicate approval decisionId '${entry.decisionId}'`
      });
    }
    approvalIds.add(entry.decisionId);
    if (entry.state === "HUMAN_APPROVED") {
      humanApprovedDecisionIds.add(entry.decisionId);
    }
  }

  const knownProfileIds = new Set<string>();
  let animProfileData: Record<string, any> | null = null;
  let animProfileSha256: string | null = null;

  for (const [profKey, profMeta] of Object.entries<Record<string, any>>(catalog.profiles ?? {})) {
    const profAbs = assertSafeRepoPath(rootDir, profMeta.path, errors, `profiles.${profKey}`);
    if (!profAbs || !fs.existsSync(profAbs)) {
      errors.push({
        code: "MISSING_PROFILE_FILE",
        message: `Missing profile file ${profMeta.path}`,
        path: profMeta.path
      });
      continue;
    }
    const actualHash = sha256File(profAbs);
    if (actualHash !== profMeta.sha256) {
      errors.push({
        code: "PROFILE_HASH_MISMATCH",
        message: `SHA-256 mismatch for profile ${profMeta.path}: expected ${profMeta.sha256}, got ${actualHash}`,
        path: profMeta.path
      });
    }
    knownProfileIds.add(profMeta.profileGroupId);
    const parsedProf = JSON.parse(fs.readFileSync(profAbs, "utf8"));
    if (profKey === "animation") {
      animProfileData = parsedProf;
      animProfileSha256 = profMeta.sha256;
      for (const pid of Object.keys(parsedProf.profiles ?? {})) {
        knownProfileIds.add(pid);
      }
    }
    if (profKey === "uiTokens") {
      const checkUiAssetPath = (relPath: string, label: string) => {
        const imgAbs = assertSafeRepoPath(rootDir, relPath, errors, label);
        if (!imgAbs || !fs.existsSync(imgAbs)) {
          errors.push({
            code: "MISSING_UI_TOKEN_ASSET",
            message: `Missing UI token asset ${relPath} (${label})`,
            path: relPath
          });
        }
      };
      for (const [fKey, fVal] of Object.entries<Record<string, any>>(parsedProf.nineSliceFrames ?? {})) {
        checkUiAssetPath(fVal.imagePath, `uiTokens.nineSliceFrames.${fKey}`);
        for (const [vKey, vPath] of Object.entries<string>(fVal.sizeVariants ?? {})) {
          checkUiAssetPath(vPath, `uiTokens.nineSliceFrames.${fKey}.sizeVariants.${vKey}`);
        }
      }
      for (const [famKey, famVal] of Object.entries<Record<string, string>>(parsedProf.buttonFamilies ?? {})) {
        for (const [stateKey, statePath] of Object.entries<string>(famVal ?? {})) {
          checkUiAssetPath(statePath, `uiTokens.buttonFamilies.${famKey}.${stateKey}`);
        }
      }
      for (const [groupKey, groupVal] of Object.entries<Record<string, string>>(parsedProf.destinyAndItemRarityFrames ?? {})) {
        for (const [itemKey, itemPath] of Object.entries<string>(groupVal ?? {})) {
          checkUiAssetPath(itemPath, `uiTokens.destinyAndItemRarityFrames.${groupKey}.${itemKey}`);
        }
      }
      for (const [sizeKey, sizeVal] of Object.entries<Record<string, any>>(parsedProf.iconSizes ?? {})) {
        if (typeof sizeVal?.directory === "string") {
          checkUiAssetPath(sizeVal.directory, `uiTokens.iconSizes.${sizeKey}.directory`);
        }
      }
    }
  }

  const defaultProjectionRel = "apps/client/src/game/assets/runtimeAnimationProjection.json";
  const defaultProjectionAbs = path.join(rootDir, defaultProjectionRel);
  if (catalog.runtimeProjection !== undefined || fs.existsSync(defaultProjectionAbs)) {
    const rp = catalog.runtimeProjection;
    if (
      !rp ||
      typeof rp.path !== "string" ||
      typeof rp.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(rp.sha256)
    ) {
      errors.push({
        code: "INVALID_RUNTIME_PROJECTION_CONFIG",
        message: `catalog.runtimeProjection must specify a valid path and 64-char hex sha256`,
        path: rp?.path ?? defaultProjectionRel
      });
    } else {
      const projAbs = assertSafeRepoPath(rootDir, rp.path, errors, "catalog.runtimeProjection.path");
      if (!projAbs || !fs.existsSync(projAbs)) {
        errors.push({
          code: "MISSING_RUNTIME_PROJECTION_FILE",
          message: `Missing runtime animation projection file '${rp.path}'`,
          path: rp.path
        });
      } else {
        const actualProjSha = sha256File(projAbs);
        if (actualProjSha !== rp.sha256) {
          errors.push({
            code: "RUNTIME_PROJECTION_HASH_MISMATCH",
            message: `SHA-256 mismatch for runtimeAnimationProjection '${rp.path}': expected ${rp.sha256}, got ${actualProjSha}`,
            path: rp.path
          });
        }
        try {
          const projData = JSON.parse(fs.readFileSync(projAbs, "utf8"));
          if (animProfileSha256 && projData.sourceAnimationProfileSha256 !== animProfileSha256) {
            errors.push({
              code: "STALE_RUNTIME_PROJECTION_SOURCE_HASH",
              message: `runtimeAnimationProjection sourceAnimationProfileSha256 '${String(projData.sourceAnimationProfileSha256)}' does not match profiles.animation.sha256 '${animProfileSha256}'`,
              path: rp.path
            });
          }
          if (animProfileData && animProfileSha256) {
            const expectedProj = deriveRuntimeAnimationProjection(animProfileData, animProfileSha256);
            if (
              JSON.stringify(projData.profiles) !== JSON.stringify(expectedProj.profiles) ||
              JSON.stringify(projData.spriteBindings) !== JSON.stringify(expectedProj.spriteBindings)
            ) {
              errors.push({
                code: "RUNTIME_PROJECTION_CONTENT_MISMATCH",
                message: `runtimeAnimationProjection '${rp.path}' profiles or spriteBindings diverge from profiles/animation.json`,
                path: rp.path
              });
            }
          }
        } catch (err) {
          errors.push({
            code: "INVALID_RUNTIME_PROJECTION_JSON",
            message: `Failed to parse runtimeAnimationProjection '${rp.path}': ${err instanceof Error ? err.message : String(err)}`,
            path: rp.path
          });
        }
      }
    }
  }

  const uiAtlasMappingRel = "assets/ui/batch_a_ui_atlas_mapping.json";
  const uiAtlasMappingAbs = path.join(rootDir, uiAtlasMappingRel);
  if (fs.existsSync(uiAtlasMappingAbs)) {
    try {
      const uiMap = JSON.parse(fs.readFileSync(uiAtlasMappingAbs, "utf8"));
      const checkMappedPath = (p: unknown, label: string) => {
        if (typeof p !== "string") {
          return;
        }
        const abs = assertSafeRepoPath(rootDir, p, errors, label);
        if (!abs || !fs.existsSync(abs)) {
          errors.push({
            code: "MISSING_UI_ATLAS_MAPPING_ASSET",
            message: `Missing UI atlas mapping asset '${p}' (${label})`,
            path: p
          });
        }
      };
      for (const entry of uiMap.nineSliceFrames ?? []) {
        checkMappedPath(entry.path, `batch_a_ui_atlas_mapping.nineSliceFrames.${entry.id}`);
        for (const [szKey, szVal] of Object.entries<Record<string, any>>(entry.testedSizes ?? {})) {
          checkMappedPath(szVal?.path, `batch_a_ui_atlas_mapping.nineSliceFrames.${entry.id}.${szKey}`);
        }
      }
      for (const section of ["hudChrome", "characterCreationAndCPanel", "buttonsAndTabs", "itemRaritySlotFrames", "questTrackerAndPrompts"]) {
        for (const entry of uiMap[section] ?? []) {
          checkMappedPath(entry.path, `batch_a_ui_atlas_mapping.${section}.${entry.id}`);
        }
      }
      for (const entry of uiMap.icons ?? []) {
        checkMappedPath(entry.path64, `batch_a_ui_atlas_mapping.icons.${entry.id}.path64`);
        checkMappedPath(entry.path32, `batch_a_ui_atlas_mapping.icons.${entry.id}.path32`);
      }
    } catch (err) {
      errors.push({
        code: "INVALID_UI_ATLAS_MAPPING_JSON",
        message: `Failed to parse ${uiAtlasMappingRel}: ${err instanceof Error ? err.message : String(err)}`,
        path: uiAtlasMappingRel
      });
    }
  }

  const forbiddenPatterns: string[] = catalog.forbiddenMasterPatterns ?? [];
  const activeCountByRefId = new Map<string, number>();
  const allRuntimeBindingsInCatalog = new Set<string>();

  for (const ref of catalog.references ?? []) {
    const refId = ref.referenceId;
    if (!refId || typeof ref.version !== "string") {
      errors.push({
        code: "MISSING_REFERENCE_METADATA",
        message: `Reference entry missing referenceId or version`
      });
      continue;
    }
    if (ref.active === true) {
      activeCountByRefId.set(refId, (activeCountByRefId.get(refId) ?? 0) + 1);
      if ((activeCountByRefId.get(refId) ?? 0) > 1) {
        errors.push({
          code: "DUPLICATE_ACTIVE_VERSION",
          message: `Reference '${refId}' has multiple active versions in catalog.references`,
          path: refId
        });
      }
    } else {
      errors.push({
        code: "INACTIVE_ENTRY_IN_ACTIVE_REFERENCES",
        message: `Inactive reference '${refId}' must be placed in supersededReferences, not references`,
        path: refId
      });
    }

    if (ref.role !== "master_reference") {
      errors.push({
        code: "INVALID_MASTER_ROLE",
        message: `Active reference '${refId}' must have role='master_reference', got '${ref.role}'`,
        path: refId
      });
    }

    if (ref.creativeApprovalState !== "HUMAN_APPROVED") {
      errors.push({
        code: "NON_HUMAN_APPROVED_ACTIVE_MASTER",
        message: `Active reference '${refId}' must have creativeApprovalState='HUMAN_APPROVED', got '${String(ref.creativeApprovalState)}'`,
        path: refId
      });
    }

    if (
      !ref.approvalRecordId ||
      !humanApprovedDecisionIds.has(ref.approvalRecordId) ||
      !ref.approvalScope ||
      !ref.approvedDate ||
      !ref.approvalSource
    ) {
      errors.push({
        code: "MISSING_APPROVAL_RECORD",
        message: `Active reference '${refId}' lacks a valid HUMAN_APPROVED approvalRecordId/scope/date/source linked to approvalLedger`,
        path: refId
      });
    }

    if (!ref.profileId || !knownProfileIds.has(ref.profileId)) {
      errors.push({
        code: "UNKNOWN_PROFILE_REFERENCE",
        message: `Active reference '${refId}' references unknown profileId '${ref.profileId}'`,
        path: refId
      });
    }

    if (!Array.isArray(ref.masterFiles) || ref.masterFiles.length === 0) {
      errors.push({
        code: "MISSING_MASTER_FILES",
        message: `Active reference '${refId}' has no masterFiles`,
        path: refId
      });
    }

    for (const mf of [...(ref.masterFiles ?? []), ...(ref.sourceLineage ?? [])]) {
      const mfAbs = assertSafeRepoPath(rootDir, mf.path, errors, `${refId}.file`);
      for (const pat of forbiddenPatterns) {
        if (typeof mf.path === "string" && mf.path.includes(pat)) {
          errors.push({
            code: "FORBIDDEN_ARCHIVE_OR_REJECTED_MASTER",
            message: `Active reference '${refId}' references forbidden/archived/rejected file '${mf.path}' (matched '${pat}')`,
            path: mf.path
          });
        }
      }
      if (!mfAbs || !fs.existsSync(mfAbs)) {
        errors.push({
          code: "MISSING_MASTER_FILE",
          message: `Missing master or source lineage file '${mf.path}' for '${refId}'`,
          path: mf.path
        });
        continue;
      }
      const actualSha = sha256File(mfAbs);
      if (actualSha !== mf.sha256) {
        errors.push({
          code: "MASTER_HASH_MISMATCH",
          message: `SHA-256 mismatch for '${mf.path}' in '${refId}': expected ${mf.sha256}, got ${actualSha}`,
          path: mf.path
        });
      }
    }

    for (const rb of ref.runtimeBindings ?? []) {
      allRuntimeBindingsInCatalog.add(rb);
    }
  }

  const requiredOverrideRefs = [
    "v01b.char.hero_kiem_tu",
    "v01b.npc.phi_de",
    "v01b.npc.rmt_de"
  ];
  for (const refId of requiredOverrideRefs) {
    try {
      const resolved = resolveActiveCorekitReference(catalog, refId);
      const majorMatch = /^(\d+)\./.exec(String(resolved.version ?? ""));
      const majorVersion = majorMatch ? Number(majorMatch[1]) : 0;
      if (majorVersion < 2) {
        errors.push({
          code: "STALE_OWNER_OVERRIDE_VERSION",
          message: `Active '${refId}' version '${String(resolved.version)}' must be major version >= 2 (post-correction owner override)`,
          path: refId
        });
      }
    } catch (err) {
      errors.push({
        code: "MISSING_REQUIRED_OWNER_OVERRIDE",
        message: err instanceof Error ? err.message : String(err),
        path: refId
      });
    }
  }

  const manifestById = new Map<string, Record<string, any>>();
  const manifestByFile = new Map<string, Record<string, any>>();
  for (const asset of manifest.assets ?? []) {
    manifestById.set(asset.assetId, asset);
    manifestByFile.set(asset.file, asset);
  }

  for (const rb of allRuntimeBindingsInCatalog) {
    if (!manifestById.has(rb)) {
      errors.push({
        code: "MISSING_RUNTIME_BINDING",
        message: `Catalog runtimeBinding '${rb}' does not exist in assets/manifest.json`,
        path: rb
      });
    }
  }

  const legacyExceptionsByAssetId = new Map<string, Record<string, any>>();
  for (const exc of catalog.legacyRequiredExceptions ?? []) {
    legacyExceptionsByAssetId.set(exc.assetId, exc);
    const excAbs = assertSafeRepoPath(rootDir, exc.file, errors, `legacyRequiredExceptions.${exc.exceptionId}`);
    if (!excAbs || !fs.existsSync(excAbs)) {
      errors.push({
        code: "MISSING_LEGACY_EXCEPTION_FILE",
        message: `Missing legacy_required file '${exc.file}'`,
        path: exc.file
      });
    } else if (sha256File(excAbs) !== exc.sha256) {
      errors.push({
        code: "LEGACY_EXCEPTION_HASH_MISMATCH",
        message: `SHA-256 mismatch for legacy_required file '${exc.file}'`,
        path: exc.file
      });
    }
    if (exc.cannotBeUsedAsV01bMaster !== true || !exc.replacementCondition) {
      errors.push({
        code: "UNBOUNDED_LEGACY_EXCEPTION",
        message: `Legacy exception '${exc.exceptionId}' must declare cannotBeUsedAsV01bMaster=true and replacementCondition`,
        path: exc.file
      });
    }
  }

  let humanApprovedRuntimeCount = 0;
  for (const asset of manifest.assets ?? []) {
    const assetAbs = assertSafeRepoPath(rootDir, asset.file, errors, `manifest.${asset.assetId}`);
    if (!assetAbs || !fs.existsSync(assetAbs)) {
      errors.push({
        code: "MISSING_MANIFEST_ASSET_FILE",
        message: `Missing manifest asset file '${asset.file}'`,
        path: asset.file
      });
    }
    if (asset.creativeApprovalState === "HUMAN_APPROVED") {
      humanApprovedRuntimeCount++;
    }
    if (asset.role === "legacy_required" && !legacyExceptionsByAssetId.has(asset.assetId)) {
      errors.push({
        code: "UNLISTED_LEGACY_REQUIRED_ASSET",
        message: `Manifest asset '${asset.assetId}' has role='legacy_required' but is not listed in catalog.legacyRequiredExceptions`,
        path: asset.file
      });
    }

    if (
      animProfileData &&
      (asset.category === "character_spritesheet" || asset.category === "creature_spritesheet")
    ) {
      const charKey = asset.characterId;
      const binding = animProfileData.spriteBindings?.[charKey];
      if (!binding) {
        errors.push({
          code: "MISSING_SPRITE_PROFILE_BINDING",
          message: `Spritesheet '${asset.assetId}' (characterId='${charKey}') has no binding in profiles/animation.json`,
          path: asset.file
        });
      } else {
        const prof = animProfileData.profiles?.[binding.profileId];
        if (!prof) {
          errors.push({
            code: "UNKNOWN_SPRITE_PROFILE",
            message: `Sprite '${charKey}' binds to unknown profile '${binding.profileId}'`,
            path: asset.file
          });
        } else if (
          asset.width !== prof.sheetWidth ||
          asset.height !== prof.sheetHeight ||
          asset.frameWidth !== prof.frameWidth ||
          asset.frameHeight !== prof.frameHeight
        ) {
          errors.push({
            code: "MISMATCHED_SPRITE_PROFILE_GEOMETRY",
            message: `Sprite '${asset.assetId}' geometry (${asset.width}x${asset.height}, frame ${asset.frameWidth}x${asset.frameHeight}) mismatches profile '${binding.profileId}' (${prof.sheetWidth}x${prof.sheetHeight}, frame ${prof.frameWidth}x${prof.frameHeight})`,
            path: asset.file
          });
        }
      }
    }

    if (asset.animations) {
      for (const [animName, animDef] of Object.entries<Record<string, any>>(asset.animations)) {
        if (animDef && typeof animDef.gif === "string") {
          const gifAbs = assertSafeRepoPath(
            rootDir,
            animDef.gif,
            errors,
            `manifest.${asset.assetId}.animations.${animName}.gif`
          );
          if (!gifAbs || !fs.existsSync(gifAbs)) {
            errors.push({
              code: "MISSING_MANIFEST_ANIMATION_GIF",
              message: `Missing animation preview GIF '${animDef.gif}' for '${asset.assetId}'`,
              path: animDef.gif
            });
          }
        }
      }
    }
  }

  if (manifest.assets?.length >= 40 && humanApprovedRuntimeCount === manifest.assets.length) {
    errors.push({
      code: "MASS_PROMOTION_TO_HUMAN_APPROVED_FORBIDDEN",
      message: `All ${manifest.assets.length} runtime assets in manifest.json cannot be mass-promoted to HUMAN_APPROVED without individual runtime sign-off`
    });
  }

  for (const charProv of provenance.characters ?? []) {
    const jobErrors = validateProductionJobSpec(
      catalog,
      {
        jobId: `provenance.characters.${charProv.characterId}`,
        referenceId: charProv.corekitReferenceId ?? `v01b.char.${charProv.characterId}`,
        profileId: animProfileData?.spriteBindings?.[charProv.characterId]?.profileId ?? "full_80x96_20row",
        generationProvider: charProv.generationProvider,
        generationMethod: charProv.generationMethod ?? "",
        postProcessingSteps: charProv.postProcessingSteps ?? [],
        sourceFiles: charProv.sourceAiFiles ?? []
      },
      { rootDir, knownProfileIds }
    );
    errors.push(...jobErrors);
  }

  for (const newJob of provenance.newProductionJobs ?? []) {
    errors.push(...validateProductionJobSpec(catalog, newJob, { rootDir, knownProfileIds }));
  }

  for (const mapEntry of manifest.maps ?? []) {
    const mapAbs = assertSafeRepoPath(rootDir, mapEntry.file, errors, `manifest.maps.${mapEntry.zoneId}`);
    if (!mapAbs || !fs.existsSync(mapAbs)) {
      errors.push({
        code: "MISSING_TILED_MAP",
        message: `Missing Tiled map '${mapEntry.file}'`,
        path: mapEntry.file
      });
      continue;
    }
    const mapJson = JSON.parse(fs.readFileSync(mapAbs, "utf8"));
    const mapDirRel = path.posix.dirname(mapEntry.file);
    for (const ts of mapJson.tilesets ?? []) {
      if (typeof ts.source === "string") {
        const tsxRel = path.posix.normalize(path.posix.join(mapDirRel, ts.source));
        const tsxAbs = assertSafeRepoPath(rootDir, tsxRel, errors, `map.${mapEntry.zoneId}.tsx`);
        if (!tsxAbs || !fs.existsSync(tsxAbs)) {
          errors.push({
            code: "BROKEN_TILED_TSX_REFERENCE",
            message: `Tiled map '${mapEntry.file}' references missing TSX '${tsxRel}'`,
            path: tsxRel
          });
        }
      }
      if (typeof ts.image === "string") {
        const imgRel = path.posix.normalize(path.posix.join(mapDirRel, ts.image));
        const imgAbs = assertSafeRepoPath(rootDir, imgRel, errors, `map.${mapEntry.zoneId}.tilesetImage`);
        if (!imgAbs || !fs.existsSync(imgAbs)) {
          errors.push({
            code: "BROKEN_TILED_IMAGE_REFERENCE",
            message: `Tiled map '${mapEntry.file}' references missing tileset image '${imgRel}'`,
            path: imgRel
          });
        } else if (!manifestByFile.has(imgRel)) {
          errors.push({
            code: "UNREGISTERED_TILED_TILESET_IMAGE",
            message: `Tiled map '${mapEntry.file}' tileset image '${imgRel}' is not registered in assets/manifest.json`,
            path: imgRel
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      activeReferenceCount: (catalog.references ?? []).length,
      supersededReferenceCount: (catalog.supersededReferences ?? []).length,
      legacyExceptionCount: (catalog.legacyRequiredExceptions ?? []).length,
      verifiedManifestAssets: (manifest.assets ?? []).length,
      verifiedTiledMaps: (manifest.maps ?? []).length
    }
  };
}

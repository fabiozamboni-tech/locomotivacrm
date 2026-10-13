import { createServerFn } from "@tanstack/react-start";
import {
  getDbState,
  saveEmpresa,
  saveAllEmpresas,
  deleteEmpresa,
  saveEmpresaExcluida,
  deleteEmpresaExcluida,
  clearEmpresasExcluidas,
  saveInstagramProfiles,
  deleteInstagramProfile,
  clearInstagramProfiles,
  saveWeights,
  saveComunicacaoSettings,
  resetDatabaseToDefaults,
  getDatabaseInfo,
  type EmpresaExcluida,
  type InstagramProfile,
  type DatabaseInfo,
  type CrmDatabaseState,
} from "./server-db";
import type { Empresa } from "./mock-data";
import type { ScoreWeights } from "./scoring";
import type { ComunicacaoSettings } from "./comunicacao-settings";

// -----------------------------------------------------------------------------
// SERVER FUNCTIONS PARA PERSISTÊNCIA EM BANCO DE DADOS
// -----------------------------------------------------------------------------

export const getDatabaseState_ServerFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<CrmDatabaseState> => {
    return await getDbState();
  });

export const saveEmpresa_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: Empresa) => data)
  .handler(async ({ data }): Promise<Empresa> => {
    return await saveEmpresa(data);
  });

export const saveAllEmpresas_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { empresas: Empresa[]; merge?: boolean }) => data)
  .handler(async ({ data }): Promise<Empresa[]> => {
    return await saveAllEmpresas(data.empresas, data.merge ?? true);
  });

export const deleteEmpresa_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ sucesso: boolean; id: string }> => {
    const deleted = await deleteEmpresa(data.id);
    return { sucesso: deleted, id: data.id };
  });

export const saveEmpresaExcluida_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: EmpresaExcluida) => data)
  .handler(async ({ data }): Promise<EmpresaExcluida> => {
    return await saveEmpresaExcluida(data);
  });

export const deleteEmpresaExcluida_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ sucesso: boolean }> => {
    await deleteEmpresaExcluida(data.id);
    return { sucesso: true };
  });

export const clearEmpresasExcluidas_ServerFn = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ sucesso: boolean }> => {
    await clearEmpresasExcluidas();
    return { sucesso: true };
  });

export const saveInstagramProfiles_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: InstagramProfile[]) => data)
  .handler(async ({ data }): Promise<{ adicionados: number; duplicados: number }> => {
    return await saveInstagramProfiles(data);
  });

export const deleteInstagramProfile_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ sucesso: boolean }> => {
    await deleteInstagramProfile(data.id);
    return { sucesso: true };
  });

export const clearInstagramProfiles_ServerFn = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ sucesso: boolean }> => {
    await clearInstagramProfiles();
    return { sucesso: true };
  });

export const saveWeights_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: ScoreWeights) => data)
  .handler(async ({ data }): Promise<ScoreWeights> => {
    return await saveWeights(data);
  });

export const saveComunicacaoSettings_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: Partial<ComunicacaoSettings>) => data)
  .handler(async ({ data }): Promise<ComunicacaoSettings> => {
    return await saveComunicacaoSettings(data);
  });

export const getDatabaseInfo_ServerFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<DatabaseInfo> => {
    return await getDatabaseInfo();
  });

export const resetDatabase_ServerFn = createServerFn({ method: "POST" })
  .handler(async (): Promise<CrmDatabaseState> => {
    return await resetDatabaseToDefaults();
  });

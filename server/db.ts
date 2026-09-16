import {
  BERITA_LIST,
  PENGUMUMAN_LIST,
  UMKM_LIST,
  JENIS_SURAT_LIST,
  INITIAL_PERMOHONAN_SURAT,
  INITIAL_LAPORAN_WARGA,
} from '../src/data/mockData';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export const db = {
  permohonan: clone(INITIAL_PERMOHONAN_SURAT),
  laporan: clone(INITIAL_LAPORAN_WARGA),
  berita: clone(BERITA_LIST),
  pengumuman: clone(PENGUMUMAN_LIST),
  umkm: clone(UMKM_LIST),
  jenisSurat: clone(JENIS_SURAT_LIST),
};

export function findItem<T>(list: T[], keys: (keyof T)[], value: string): T | undefined {
  return list.find((item) =>
    keys.some((key) => item[key] !== undefined && String(item[key]) === value)
  );
}
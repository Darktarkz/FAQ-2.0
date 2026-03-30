export interface Dependencia {
  id: number;
  nombre: string;
}

export interface DatosSif {
  programa_sfa: string;
  rol_desempena: string;
}

export interface DatosOrfeo {
  firma_path?: string;
}

export interface DatosContratacion {
  rol_acceso: string;
  firma_path?: string;
}

export interface DatosCajaMenor {
  rol_acceso: string;
}

export interface DatosSicapital {
  modulo: string;
}

export interface DatosPandora {
  modulo: string;
  rol: string;
}

export interface PlataformasSeleccionadas {
  sif?: DatosSif;
  orfeo?: DatosOrfeo;
  contratacion?: DatosContratacion;
  caja_menor?: DatosCajaMenor;
  sicapital?: DatosSicapital;
  pandora?: DatosPandora;
}

export interface SolicitudAcceso {
  id?: number;
  nombre_completo: string;
  tipo_documento: 'CC' | 'CE' | 'TI' | 'Pasaporte' | 'NIT';
  numero_documento: string;
  usuario_red: string;
  correo: string;
  dependencia_id: number;
  cargo_tipo: 'contratista' | 'funcionario';
  cargo_nombre?: string;
  plataformas: PlataformasSeleccionadas;
  estado?: 'pendiente' | 'en_proceso' | 'resuelto';
  created_at?: string;
  dependencia?: Dependencia;
}

export interface SolicitudAccesoResponse {
  success: boolean;
  message?: string;
  solicitud?: SolicitudAcceso;
  errors?: any;
}

export interface DependenciasResponse {
  success: boolean;
  dependencias: Dependencia[];
}

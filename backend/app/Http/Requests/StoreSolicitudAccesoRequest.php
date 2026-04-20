<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSolicitudAccesoRequest extends FormRequest
{
    /** IDs válidos de dependencias (lista estática, sin consulta a BD) */
    private const DEPENDENCIA_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33];

    public function authorize(): bool
    {
        return true; // Público, sin autenticación
    }

    public function rules(): array
    {
        return [
            'nombre_completo'  => 'required|string|max:255',
            'tipo_documento'   => 'required|in:CC,CE,TI,Pasaporte,NIT',
            'numero_documento' => 'required|string|max:50',
            'usuario_red'      => 'required|string|max:100',
            'correo'           => 'required|email|max:255',
            'dependencia_id'   => ['required', 'integer', 'in:' . implode(',', self::DEPENDENCIA_IDS)],
            'cargo_tipo'       => 'required|in:contratista,funcionario',
            'cargo_nombre'     => 'nullable|string|max:255',
            'plataformas'      => 'required|json',
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_completo.required'  => 'El nombre completo es obligatorio.',
            'tipo_documento.required'   => 'El tipo de documento es obligatorio.',
            'tipo_documento.in'         => 'Tipo de documento no válido.',
            'numero_documento.required' => 'El número de documento es obligatorio.',
            'usuario_red.required'      => 'El usuario de red es obligatorio.',
            'correo.required'           => 'El correo es obligatorio.',
            'correo.email'              => 'El correo no tiene un formato válido.',
            'dependencia_id.required'   => 'La dependencia es obligatoria.',
            'dependencia_id.exists'     => 'La dependencia seleccionada no existe.',
            'cargo_tipo.required'       => 'El tipo de cargo es obligatorio.',
            'cargo_tipo.in'             => 'El tipo de cargo debe ser contratista o funcionario.',
            'plataformas.required'      => 'Debe seleccionar al menos una plataforma.',
            'plataformas.json'          => 'El formato de plataformas no es válido.',
        ];
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Datos inválidos: ' . implode(', ', $validator->errors()->all()),
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}

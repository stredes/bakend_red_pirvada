#!/bin/bash

# Script de prueba para los endpoints del backend
# Uso: bash test-endpoints.sh

BASE_URL="http://localhost:3000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== PRUEBAS DEL BACKEND DE IMÁGENES ===${NC}\n"

# 1. Generar token
echo -e "${YELLOW}1. Generando token de autenticación...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/token")
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error al generar token${NC}"
  echo $TOKEN_RESPONSE
  exit 1
fi

echo -e "${GREEN}✅ Token generado exitosamente${NC}"
echo "Token: $TOKEN"
echo ""

# 2. Obtener información del servidor
echo -e "${YELLOW}2. Obteniendo información del servidor...${NC}"
curl -s "$BASE_URL/" | jq '.'
echo ""

# 3. Listar imágenes (antes de subir)
echo -e "${YELLOW}3. Listando imágenes actuales...${NC}"
curl -s "$BASE_URL/images" | jq '.'
echo ""

# 4. Crear imagen de prueba
echo -e "${YELLOW}4. Creando imagen de prueba...${NC}"
# Crear un PNG pequeño de 1x1 píxel
python3 << 'EOF'
from PIL import Image
img = Image.new('RGB', (100, 100), color='red')
img.save('/tmp/test-image.png')
print("✅ Imagen de prueba creada en /tmp/test-image.png")
EOF
echo ""

# 5. Subir imagen
echo -e "${YELLOW}5. Subiendo imagen...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/test-image.png")

echo $UPLOAD_RESPONSE | jq '.'
IMAGE_FILENAME=$(echo $UPLOAD_RESPONSE | grep -o '"filename":"[^"]*' | head -1 | cut -d'"' -f4)
IMAGE_URL=$(echo $UPLOAD_RESPONSE | grep -o '"publicUrl":"[^"]*' | cut -d'"' -f4)

if [ -z "$IMAGE_FILENAME" ]; then
  echo -e "${RED}❌ Error al subir imagen${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Imagen subida: $IMAGE_FILENAME${NC}"
echo ""

# 6. Generar URL firmada
echo -e "${YELLOW}6. Generando URL firmada...${NC}"
curl -s -X POST "$BASE_URL/upload-url" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productoId": "prod-123",
    "mimeType": "image/png"
  }' | jq '.'
echo ""

# 7. Listar imágenes (después de subir)
echo -e "${YELLOW}7. Listando imágenes después de subida...${NC}"
curl -s "$BASE_URL/images" | jq '.'
echo ""

# 8. Obtener imagen
echo -e "${YELLOW}8. Descargando imagen...${NC}"
curl -s -I "$IMAGE_URL" | head -5
echo -e "${GREEN}✅ Imagen accesible en: $IMAGE_URL${NC}"
echo ""

# 9. Eliminar imagen
echo -e "${YELLOW}9. Eliminando imagen...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/images/$IMAGE_FILENAME" \
  -H "Authorization: Bearer $TOKEN")

echo $DELETE_RESPONSE | jq '.'
echo ""

# 10. Verificar que fue eliminada
echo -e "${YELLOW}10. Verificando que la imagen fue eliminada...${NC}"
curl -s "$BASE_URL/images" | jq '.'
echo ""

echo -e "${GREEN}=== PRUEBAS COMPLETADAS ===${NC}"

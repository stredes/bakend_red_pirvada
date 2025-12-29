/**
 * Ejemplo de integración del backend de imágenes con una app Android
 * 
 * Este archivo muestra cómo:
 * 1. Generar un token de autenticación
 * 2. Subir una imagen al backend
 * 3. Guardar la URL en la base de datos
 * 4. Mostrar la imagen con Coil
 */

package com.example.productapp.data.repository

import android.content.Context
import android.net.Uri
import androidx.core.net.toFile
import com.example.productapp.data.api.ImageUploadService
import com.example.productapp.data.db.ProductDao
import com.example.productapp.domain.model.Product
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import javax.inject.Inject

class ProductRepository @Inject constructor(
    private val productDao: ProductDao,
    private val imageUploadService: ImageUploadService,
    private val context: Context
) {

    /**
     * Subir imagen de producto y guardar la URL
     */
    suspend fun uploadProductImage(
        productId: String,
        imageUri: Uri
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            // 1. Generar token
            val tokenResponse = imageUploadService.generateToken()
            val token = "Bearer ${tokenResponse.token}"

            // 2. Preparar archivo
            val file = imageUri.toFile()
            val requestBody = file.asRequestBody("image/jpeg".toMediaType())
            val multipartBody = MultipartBody.Part.createFormData(
                "image",
                file.name,
                requestBody
            )

            // 3. Subir imagen
            val uploadResponse = imageUploadService.uploadImage(token, multipartBody)

            // 4. Guardar URL en base de datos
            val product = productDao.getProductById(productId)
            if (product != null) {
                val updatedProduct = product.copy(
                    imagenUri = uploadResponse.file.publicUrl
                )
                productDao.updateProduct(updatedProduct)
            }

            Result.success(uploadResponse.file.publicUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Subir imagen usando pre-signed URL (alternativa más eficiente)
     */
    suspend fun uploadProductImagePresigned(
        productId: String,
        imageUri: Uri
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            // 1. Generar token
            val tokenResponse = imageUploadService.generateToken()
            val token = "Bearer ${tokenResponse.token}"

            // 2. Obtener URL firmada
            val presignedResponse = imageUploadService.getPresignedUrl(
                token,
                PresignedUrlRequest(
                    productoId = productId,
                    mimeType = "image/jpeg"
                )
            )

            // 3. Subir directamente a la URL firmada
            val file = imageUri.toFile()
            val requestBody = file.asRequestBody("image/jpeg".toMediaType())
            imageUploadService.uploadToPresignedUrl(
                presignedResponse.uploadUrl,
                requestBody
            )

            // 4. Guardar URL pública en base de datos
            val product = productDao.getProductById(productId)
            if (product != null) {
                val updatedProduct = product.copy(
                    imagenUri = presignedResponse.publicUrl
                )
                productDao.updateProduct(updatedProduct)
            }

            Result.success(presignedResponse.publicUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Eliminar imagen del servidor
     */
    suspend fun deleteProductImage(
        productId: String,
        imageUrl: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Extraer nombre del archivo de la URL
            val filename = imageUrl.substringAfterLast("/")

            // Generar token
            val tokenResponse = imageUploadService.generateToken()
            val token = "Bearer ${tokenResponse.token}"

            // Eliminar del servidor
            imageUploadService.deleteImage(token, filename)

            // Limpiar URL en base de datos
            val product = productDao.getProductById(productId)
            if (product != null) {
                val updatedProduct = product.copy(imagenUri = null)
                productDao.updateProduct(updatedProduct)
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAllProducts(): List<Product> {
        return productDao.getAllProducts()
    }

    suspend fun getProductById(id: String): Product? {
        return productDao.getProductById(id)
    }
}

/**
 * Interfaz Retrofit para comunicación con el backend
 */
interface ImageUploadService {

    /**
     * Generar token de autenticación
     */
    suspend fun generateToken(): TokenResponse

    /**
     * Subir imagen directamente (multipart)
     */
    @Multipart
    @POST("upload")
    suspend fun uploadImage(
        @Header("Authorization") token: String,
        @Part image: MultipartBody.Part
    ): UploadResponse

    /**
     * Obtener URL firmada para subida
     */
    @POST("upload-url")
    suspend fun getPresignedUrl(
        @Header("Authorization") token: String,
        @Body request: PresignedUrlRequest
    ): PresignedUrlResponse

    /**
     * Subir a URL firmada
     */
    @PUT
    suspend fun uploadToPresignedUrl(
        @Url url: String,
        @Body file: RequestBody
    )

    /**
     * Eliminar imagen
     */
    @DELETE("images/{filename}")
    suspend fun deleteImage(
        @Header("Authorization") token: String,
        @Path("filename") filename: String
    ): DeleteResponse

    /**
     * Obtener imagen
     */
    @GET("images/{filename}")
    suspend fun getImage(
        @Path("filename") filename: String
    ): ResponseBody
}

// Modelos de datos

data class TokenResponse(
    val token: String,
    val expiresIn: String,
    val user: UserInfo
)

data class UserInfo(
    val id: String,
    val role: String,
    val email: String
)

data class UploadResponse(
    val success: Boolean,
    val message: String,
    val file: FileInfo
)

data class FileInfo(
    val filename: String,
    val originalName: String,
    val size: Long,
    val mimetype: String,
    val uploadedAt: String,
    val publicUrl: String,
    val localPath: String
)

data class PresignedUrlRequest(
    val productoId: String,
    val mimeType: String
)

data class PresignedUrlResponse(
    val success: Boolean,
    val uploadUrl: String,
    val publicUrl: String,
    val filename: String,
    val expiresIn: Int,
    val method: String
)

data class DeleteResponse(
    val success: Boolean,
    val message: String,
    val filename: String
)

/**
 * ViewModel para manejar la subida de imágenes
 */
class ProductViewModel @Inject constructor(
    private val repository: ProductRepository
) : ViewModel() {

    private val _uploadState = MutableStateFlow<UploadState>(UploadState.Idle)
    val uploadState: StateFlow<UploadState> = _uploadState.asStateFlow()

    fun uploadProductImage(productId: String, imageUri: Uri) {
        viewModelScope.launch {
            _uploadState.value = UploadState.Loading

            val result = repository.uploadProductImage(productId, imageUri)
            _uploadState.value = if (result.isSuccess) {
                UploadState.Success(result.getOrNull() ?: "")
            } else {
                UploadState.Error(result.exceptionOrNull()?.message ?: "Error desconocido")
            }
        }
    }

    fun deleteProductImage(productId: String, imageUrl: String) {
        viewModelScope.launch {
            _uploadState.value = UploadState.Loading

            val result = repository.deleteProductImage(productId, imageUrl)
            _uploadState.value = if (result.isSuccess) {
                UploadState.Success("Imagen eliminada")
            } else {
                UploadState.Error(result.exceptionOrNull()?.message ?: "Error desconocido")
            }
        }
    }
}

sealed class UploadState {
    object Idle : UploadState()
    object Loading : UploadState()
    data class Success(val imageUrl: String) : UploadState()
    data class Error(val message: String) : UploadState()
}

/**
 * Composable para mostrar imagen con Coil
 */
@Composable
fun ProductImageDisplay(
    imageUrl: String?,
    contentDescription: String = "Imagen del producto"
) {
    if (imageUrl != null) {
        AsyncImage(
            model = imageUrl,
            contentDescription = contentDescription,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
        )
    } else {
        // Placeholder
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .background(Color.LightGray),
            contentAlignment = Alignment.Center
        ) {
            Text("Sin imagen")
        }
    }
}

/**
 * Composable para subir imagen
 */
@Composable
fun ProductImageUpload(
    productId: String,
    viewModel: ProductViewModel,
    onImageSelected: (Uri) -> Unit
) {
    val uploadState by viewModel.uploadState.collectAsState()
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            onImageSelected(it)
            viewModel.uploadProductImage(productId, it)
        }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { launcher.launch("image/*") }) {
            Text("Seleccionar imagen")
        }

        when (uploadState) {
            is UploadState.Loading -> {
                CircularProgressIndicator()
            }
            is UploadState.Success -> {
                Text(
                    "Imagen subida exitosamente",
                    color = Color.Green
                )
            }
            is UploadState.Error -> {
                Text(
                    "Error: ${(uploadState as UploadState.Error).message}",
                    color = Color.Red
                )
            }
            else -> {}
        }
    }
}

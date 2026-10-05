plugins {
    id("com.android.application")
}

val uploadKeystorePath = System.getenv("ANDROID_UPLOAD_KEYSTORE_PATH")
val uploadStorePassword = System.getenv("ANDROID_UPLOAD_STORE_PASSWORD")
val uploadKeyAlias = System.getenv("ANDROID_UPLOAD_KEY_ALIAS")
val uploadKeyPassword = System.getenv("ANDROID_UPLOAD_KEY_PASSWORD")

android {
    namespace = "com.michelslab.michelslife"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.michelslab.michelslife"
        minSdk = 26
        targetSdk = 36
        versionCode = 3
        versionName = "0.2.1"
    }

    signingConfigs {
        if (!uploadKeystorePath.isNullOrBlank() &&
            !uploadStorePassword.isNullOrBlank() &&
            !uploadKeyAlias.isNullOrBlank() &&
            !uploadKeyPassword.isNullOrBlank()) {
            create("playUpload") {
                storeFile = file(uploadKeystorePath)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfigs.findByName("playUpload")?.let { signingConfig = it }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.16.0")
    implementation("com.google.android.gms:play-services-auth:22.0.0")
    implementation("com.squareup.okhttp3:okhttp:5.4.0")
}

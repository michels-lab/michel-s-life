plugins {
    id("com.android.application")
}

android {
    namespace = "com.michelslab.michelslife"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.michelslab.michelslife"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
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

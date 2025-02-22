<template>
    <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-xl font-semibold mb-4">Available Primatives</h2>

        <ul>
            <li v-for="primitive in primitivesList" :key="primitive.name">
                <b>{{ primitive.name }}</b>
                <p>{{ primitive.description }}</p>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
    import { onMounted, ref } from "vue";
    import { primitives, type Primitive } from "@/lib/primitives";

    const primitivesList = ref<Primitive[]>([]);

    onMounted(() => {
        console.log("Imported primitives:", primitives);
        primitivesList.value = Object.values(primitives);
        console.log("PrimitivesList value:", primitivesList.value);
    });
</script>

<template>
    {{ lib }}
</template>

<script setup lang="ts">
    import { useMyLibary } from '../../src/index';
    const lib = useMyLibary();
</script>

<style scoped lang="less">
    ul {
        list-style: none;
        padding: 0;

        li {
            padding: 5px;
            margin: 10px 0;
            background: lightgray;

            &.active {
                background: skyblue;
            }
        }
    }

    p {
        margin: 5px 0;
    }

    span {
        + span {
            margin-left: 20px;
        }
    }
</style>

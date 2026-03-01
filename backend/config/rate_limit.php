<?php

return [
    'global' => env('RATE_LIMIT_GLOBAL', 60),
    'request_creation' => env('RATE_LIMIT_REQUEST_CREATION', 10),
];

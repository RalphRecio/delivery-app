<?php

declare(strict_types=1);

it('reports the service as healthy in the API envelope', function (): void {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertHeader('X-Request-Id')
        ->assertJson([
            'success' => true,
            'message' => null,
            'data' => ['status' => 'ok'],
            'errors' => [],
        ]);
});

it('echoes a client-supplied request id', function (): void {
    $this->getJson('/api/v1/health', ['X-Request-Id' => 'client-abc-123'])
        ->assertOk()
        ->assertHeader('X-Request-Id', 'client-abc-123');
});

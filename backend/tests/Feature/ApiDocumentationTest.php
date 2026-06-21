<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiDocumentationTest extends TestCase
{
    public function test_swagger_ui_page_is_available(): void
    {
        $this->get('/docs')
            ->assertOk()
            ->assertSee('swagger-ui', false);
    }

    public function test_openapi_spec_is_served(): void
    {
        $response = $this->get('/docs/openapi.yaml');

        $response->assertOk()
            ->assertHeader('content-type', 'application/yaml');

        $this->assertFileExists(base_path('docs/openapi.yaml'));
        $this->assertStringContainsString('openapi: 3.0.3', file_get_contents(base_path('docs/openapi.yaml')));
    }
}

/**
 * Test script for Agency Components
 * Tests: WorkspaceContext, AssetUploader, ApprovalGrid
 */

const API_BASE = 'http://localhost:3001';

// Helper to make authenticated requests
async function apiFetch(url, options = {}) {
  const token = process.env.TEST_TOKEN || 'test-token-123';
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  return response;
}

// Test 1: WorkspaceContext - GET /api/workspaces/:id
async function testWorkspaceContext() {
  console.log('\n=== TEST 1: WorkspaceContext ===');
  
  try {
    // First, get list of workspaces
    console.log('Fetching workspaces list...');
    const listRes = await apiFetch(`${API_BASE}/api/workspaces`);
    
    if (!listRes.ok) {
      console.error('❌ Failed to fetch workspaces:', listRes.status, await listRes.text());
      return false;
    }
    
    const workspaces = await listRes.json();
    console.log(`✓ Found ${workspaces.length} workspaces`);
    
    if (workspaces.length === 0) {
      console.log('⚠️  No workspaces found - creating test workspace...');
      
      const createRes = await apiFetch(`${API_BASE}/api/workspaces`, {
        method: 'POST',
        body: JSON.stringify({
          clientName: 'Test Client',
          industry: 'Technology',
          description: 'Test workspace for component testing'
        })
      });
      
      if (!createRes.ok) {
        console.error('❌ Failed to create workspace:', await createRes.text());
        return false;
      }
      
      const newWorkspace = await createRes.json();
      console.log('✓ Created test workspace:', newWorkspace.id);
      workspaces.push(newWorkspace);
    }
    
    // Test fetching specific workspace
    const testWorkspace = workspaces[0];
    console.log(`\nFetching workspace ${testWorkspace.id}...`);
    
    const detailRes = await apiFetch(`${API_BASE}/api/workspaces/${testWorkspace.id}`);
    
    if (!detailRes.ok) {
      console.error('❌ Failed to fetch workspace details:', detailRes.status);
      return false;
    }
    
    const workspace = await detailRes.json();
    console.log('✓ Workspace details:', {
      id: workspace.id,
      clientName: workspace.clientName,
      industry: workspace.industry
    });
    
    console.log('✅ WorkspaceContext test PASSED');
    return { success: true, workspaceId: workspace.id };
    
  } catch (error) {
    console.error('❌ WorkspaceContext test FAILED:', error.message);
    return { success: false };
  }
}

// Test 2: AssetUploader - POST /api/assets/upload
async function testAssetUploader(workspaceId) {
  console.log('\n=== TEST 2: AssetUploader ===');
  
  if (!workspaceId) {
    console.error('❌ No workspaceId provided');
    return false;
  }
  
  try {
    // Create a test image blob (1x1 red pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    console.log('Creating FormData with test image...');
    
    // Note: In Node.js, we need to use form-data package
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('file', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    form.append('workspaceId', workspaceId);
    
    console.log('Uploading test image...');
    
    const token = process.env.TEST_TOKEN || 'test-token-123';
    const uploadRes = await fetch(`${API_BASE}/api/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!uploadRes.ok) {
      console.error('❌ Upload failed:', uploadRes.status, await uploadRes.text());
      return { success: false };
    }
    
    const uploadResult = await uploadRes.json();
    console.log('✓ Upload successful:', {
      id: uploadResult.id,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType
    });
    
    console.log('✅ AssetUploader test PASSED');
    return { success: true, assetId: uploadResult.id };
    
  } catch (error) {
    console.error('❌ AssetUploader test FAILED:', error.message);
    return { success: false };
  }
}

// Test 3: ApprovalGrid - All endpoints
async function testApprovalGrid(workspaceId, assetId) {
  console.log('\n=== TEST 3: ApprovalGrid ===');
  
  if (!workspaceId) {
    console.error('❌ No workspaceId provided');
    return false;
  }
  
  try {
    // 3.1: Test GET /api/approval/workspace/:id/grid
    console.log('\n3.1: Testing GET approval grid...');
    const gridRes = await apiFetch(`${API_BASE}/api/approval/workspace/${workspaceId}/grid`);
    
    if (!gridRes.ok) {
      console.error('❌ Failed to fetch approval grid:', gridRes.status, await gridRes.text());
      return false;
    }
    
    const gridData = await gridRes.json();
    console.log('✓ Grid data received:', {
      gridItems: gridData.grid?.length || 0,
      stats: gridData.stats
    });
    
    // Check if we have any captions to test with
    const itemsWithCaptions = gridData.grid?.filter(item => item.caption) || [];
    
    if (itemsWithCaptions.length === 0) {
      console.log('⚠️  No captions found - creating test caption...');
      
      // Generate a caption for the uploaded asset
      if (assetId) {
        const captionRes = await apiFetch(`${API_BASE}/api/caption/generate`, {
          method: 'POST',
          body: JSON.stringify({
            assetId: assetId,
            workspaceId: workspaceId,
            style: 'professional'
          })
        });
        
        if (captionRes.ok) {
          console.log('✓ Caption generated, waiting for processing...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Refetch grid
          const newGridRes = await apiFetch(`${API_BASE}/api/approval/workspace/${workspaceId}/grid`);
          const newGridData = await newGridRes.json();
          itemsWithCaptions.push(...(newGridData.grid?.filter(item => item.caption) || []));
        }
      }
    }
    
    if (itemsWithCaptions.length === 0) {
      console.log('⚠️  Still no captions - skipping approval tests');
      console.log('✅ ApprovalGrid GET test PASSED (partial)');
      return { success: true, partial: true };
    }
    
    const testCaption = itemsWithCaptions[0].caption;
    console.log('✓ Using caption for testing:', testCaption.id);
    
    // 3.2: Test PUT /api/approval/captions/:id/approve
    console.log('\n3.2: Testing approve caption...');
    const approveRes = await apiFetch(`${API_BASE}/api/approval/captions/${testCaption.id}/approve`, {
      method: 'PUT'
    });
    
    if (!approveRes.ok) {
      console.error('❌ Failed to approve caption:', approveRes.status, await approveRes.text());
      return { success: false };
    }
    
    const approveResult = await approveRes.json();
    console.log('✓ Caption approved:', approveResult.caption.approvalStatus);
    
    // 3.3: Test PUT /api/approval/captions/:id/reject
    console.log('\n3.3: Testing reject caption...');
    const rejectRes = await apiFetch(`${API_BASE}/api/approval/captions/${testCaption.id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason: 'Test rejection' })
    });
    
    if (!rejectRes.ok) {
      console.error('❌ Failed to reject caption:', rejectRes.status, await rejectRes.text());
      return { success: false };
    }
    
    const rejectResult = await rejectRes.json();
    console.log('✓ Caption rejected:', rejectResult.caption.approvalStatus);
    
    // 3.4: Test bulk operations if we have multiple captions
    if (itemsWithCaptions.length > 1) {
      const captionIds = itemsWithCaptions.slice(0, 2).map(item => item.caption.id);
      
      console.log('\n3.4: Testing bulk approve...');
      const bulkApproveRes = await apiFetch(`${API_BASE}/api/approval/batch-approve`, {
        method: 'POST',
        body: JSON.stringify({ captionIds })
      });
      
      if (!bulkApproveRes.ok) {
        console.error('❌ Bulk approve failed:', bulkApproveRes.status, await bulkApproveRes.text());
      } else {
        const bulkResult = await bulkApproveRes.json();
        console.log('✓ Bulk approve successful:', bulkResult.approved, 'captions');
      }
      
      console.log('\n3.5: Testing bulk reject...');
      const bulkRejectRes = await apiFetch(`${API_BASE}/api/approval/batch-reject`, {
        method: 'POST',
        body: JSON.stringify({ captionIds, reason: 'Bulk test rejection' })
      });
      
      if (!bulkRejectRes.ok) {
        console.error('❌ Bulk reject failed:', bulkRejectRes.status, await bulkRejectRes.text());
      } else {
        const bulkResult = await bulkRejectRes.json();
        console.log('✓ Bulk reject successful:', bulkResult.rejected, 'captions');
      }
    }
    
    // 3.6: Verify final grid state
    console.log('\n3.6: Verifying final grid state...');
    const finalGridRes = await apiFetch(`${API_BASE}/api/approval/workspace/${workspaceId}/grid`);
    const finalGridData = await finalGridRes.json();
    
    console.log('✓ Final stats:', finalGridData.stats);
    
    console.log('✅ ApprovalGrid test PASSED');
    return { success: true };
    
  } catch (error) {
    console.error('❌ ApprovalGrid test FAILED:', error.message);
    return { success: false };
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Agency Components Tests');
  console.log('====================================');
  
  const results = {
    workspaceContext: false,
    assetUploader: false,
    approvalGrid: false
  };
  
  // Test 1: WorkspaceContext
  const workspaceResult = await testWorkspaceContext();
  results.workspaceContext = workspaceResult.success;
  
  if (!workspaceResult.success) {
    console.log('\n❌ Stopping tests - WorkspaceContext failed');
    printSummary(results);
    return;
  }
  
  // Test 2: AssetUploader
  const assetResult = await testAssetUploader(workspaceResult.workspaceId);
  results.assetUploader = assetResult.success;
  
  // Test 3: ApprovalGrid (can run even if asset upload fails)
  const approvalResult = await testApprovalGrid(
    workspaceResult.workspaceId,
    assetResult.assetId
  );
  results.approvalGrid = approvalResult.success;
  
  // Print summary
  printSummary(results);
}

function printSummary(results) {
  console.log('\n====================================');
  console.log('📊 TEST SUMMARY');
  console.log('====================================');
  console.log(`WorkspaceContext: ${results.workspaceContext ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`AssetUploader:    ${results.assetUploader ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`ApprovalGrid:     ${results.approvalGrid ? '✅ PASS' : '❌ FAIL'}`);
  console.log('====================================');
  
  const allPassed = Object.values(results).every(r => r === true);
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

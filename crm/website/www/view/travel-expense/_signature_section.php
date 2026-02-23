<?php

use yii\helpers\Html;
use yii\web\View;
use app\libs\Constant;
use app\models\ExpenseApproval;

$signatureFields = [
    'signature_requester' => '1. ผู้ขอให้ดำเนินการ/Requested by',
    'signature_manager_dept' => '2. ผู้จัดการฝ่าย/Manager (ผู้รับเงิน)',
    'signature_verifier' => '3. เจ้าหน้าที่ตรวจสอบ/Verified by',
    'signature_manager_verifier' => '4. ผู้จัดการตรวจสอบ/Manager (ผู้ตรวจ)',
    'signature_approver' => '5. ผู้อนุมัติ/Authorized by',
];

$level_index = 1;
$today = date('d/m/Y');
$modelsApproval = $modelsApproval ?? [];
$signaturesData = $signaturesData ?? [];
$users = $users ?? [];

$current_user_id = Yii::$app->user->id ?? null;
$isNewRecord = $model->isNewRecord ?? empty($model->id);
?>

<style>
    .signature-box {
        border: 1px solid #ddd;
        padding: 15px;
        margin-bottom: 25px;
        border-radius: 8px;
        background-color: #ffffff;
        min-height: 280px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.3s ease;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .signature-preview {
        max-width: 100%;
        height: 150px;
        width: 100%;
        object-fit: contain;
        border: 1px solid #ced4da;
        border-radius: 4px;
        margin-top: 10px;
        display: block;
    }

    .signature-pad-canvas {
        border: 1px solid #ced4da;
        border-radius: 4px;
        width: 100% !important;
        height: 150px !important;
    }

    .signature-container-level-hidden {
        display: none;
    }

    .cannot-sign .signature-box {
        background-color: #f7f7f7;
    }

    .unsigned-text {
        background-color: #f0f0f0;
        color: #6c757d;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        margin-top: 15px;
        margin-bottom: 15px;
        font-weight: bold;
        border: 1px solid #e9e9e9;
    }

    .status-restricted-text {
        background-color: #fce3e6;
        color: #dc3545;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        margin-top: 15px;
        margin-bottom: 15px;
        font-weight: bold;
        border: 1px solid #f7c9cf;
    }

    .status-remark-section {
        border-top: 1px dashed #eee;
        padding-top: 10px;
        margin-top: 10px;
    }

    .status-rejected {
        color: #dc3545;
        font-weight: bold;
    }

    .form-control[disabled] {
        cursor: not-allowed;
    }

    .preview-box-container {
        margin-top: 5px;
        border: 1px dashed #ccc;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fafafa;
        border-radius: 4px;
        position: relative;
    }

    .signature-preview-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        margin: 0 auto;
    }
</style>

<div class="panel panel-primary mt-4">
    <div class="panel-body">
        <div class="row">
            <?php foreach ($signatureFields as $field_name => $label_text): ?>
                <?php
                $approval = $modelsApproval[$level_index] ?? null;
                $sigData = $signaturesData[$level_index] ?? null;

                $DRAFT_STATUS = Constant::STATUS_EXPENSE_DRAFT;
                $COMPLETED_STATUS = Constant::STATUS_EXPENSE_APPROVED;
                $REJECT_STATUS = Constant::STATUS_EXPENSE_REJECTED;
                $model_status = $model->status ?? null;

                $is_ready_for_signing = false;
                if ($level_index == 1) {
                    if ($isNewRecord || $model_status == $DRAFT_STATUS || empty($model_status)) {
                        $is_ready_for_signing = true;
                    }
                } else {
                    $expected_waiting_status = $level_index - 1;
                    if ($model_status == $expected_waiting_status) {
                        $is_ready_for_signing = true;
                    }
                }

                $expected_signer_id = ($level_index == 1) 
                ? ($model->requestor_id ?? null) 
                : ($approval->approver_id ?? null);

                $is_current_signer = (!empty($expected_signer_id) && $expected_signer_id == Yii::$app->user->id);
                $is_actually_approved = ($sigData && ($sigData['status'] === 'approved' || $sigData['status'] === '1' || !empty($sigData['date'])));

                $current_signature_data = '';
                if ($is_actually_approved) {
                    $current_signature_data = $sigData['signature'] ?? '';
                } elseif ($is_current_signer && $is_ready_for_signing) {
                    $current_signature_data = $sigData['signature'] ?? (Yii::$app->user->identity->signature_path ?? '');
                }

                $has_existing_signature = !empty($current_signature_data) && $is_actually_approved;

                if (!empty($current_signature_data) && !str_starts_with($current_signature_data, 'data:image')) {
                    $clean_path = ltrim($current_signature_data, '/');
                    if (!str_starts_with($clean_path, 'uploads/') && !str_starts_with($clean_path, 'http')) {
                        $current_signature_data = Yii::getAlias('@web') . '/uploads/' . $clean_path;
                    } else {
                        $current_signature_data = Yii::getAlias('@web') . '/' . $clean_path;
                    }
                }

                $is_base64_draw = str_starts_with($current_signature_data, 'data:image/png;base64,');
                $is_draw_default = $is_base64_draw;

                $is_status_restricted = false;
                if (!$is_ready_for_signing && !$has_existing_signature) {
                    if ($model_status == $COMPLETED_STATUS || $model_status == $REJECT_STATUS) {
                        $is_status_restricted = true;
                    }
                    if ($level_index > 1 && $model_status !== null && ($model_status < $level_index - 1 || $model_status == $DRAFT_STATUS)) {
                        $is_status_restricted = true;
                    }
                }

                if ($is_actually_approved) {
                    $is_disabled = true;
                    $can_sign_now = false;
                    $current_status = ($sigData['status'] === '0' || $sigData['status'] === 'rejected') ? '0' : '1';
                    $current_remark = $sigData['remark'] ?? '';
                } elseif ($is_current_signer && $is_ready_for_signing) {
                    $is_disabled = false;
                    $can_sign_now = true;
                    $current_status = '1';
                    $current_remark = '';
                } else {
                    $is_disabled = true;
                    $can_sign_now = false;
                    $current_status = '1';
                    $current_remark = '';
                }

                $is_status_fields_disabled = !$can_sign_now;
                $is_disabled_field = $is_disabled ? ['disabled' => true] : [];
                $has_signed_class = ($has_existing_signature) ? ' has-signed' : ($is_disabled ? ' cannot-sign' : ' can-sign');

                $show_img_path = ($has_existing_signature || ($can_sign_now && !empty($current_signature_data))) ? $current_signature_data : null;
                $signature_display_style = !empty($show_img_path) ? 'display: block;' : 'display: none;';

                $name_field_name = 'TravelExpenseApproval[' . $level_index . '][name]';
                $date_field_name = 'TravelExpenseApproval[' . $level_index . '][date]';
                $status_field_name = 'TravelExpenseApproval[' . $level_index . '][status]';
                $remark_field_name = 'TravelExpenseApproval[' . $level_index . '][remark]';

                $status_field_options = ['id' => 'status-' . $level_index, 'class' => 'form-control approval-status-select', 'data-level' => $level_index];
                $remark_field_options = ['id' => 'remark-' . $level_index, 'class' => 'form-control approval-remark-input', 'rows' => 2];

                if ($is_status_fields_disabled) {
                    $status_field_options['disabled'] = true;
                    $remark_field_options['readonly'] = true;
                }

                if ($has_existing_signature && $sigData) {
                    $current_name = $sigData['name'] ?? '-';
                    $current_date = $sigData['date'] ?? '-';
                    if (!empty($current_date) && $current_date !== '-') {
                        try {
                            $dateObj = new \DateTime($current_date);
                            $current_date = $dateObj->format('d/m/Y');
                        } catch (\Exception $e) {
                        }
                    }
                } else {
                    $current_name = ($level_index == 1) ? ($model->requestor->fullName ?? $model->requestor->username ?? '-') : ($approval->approver->fullName ?? '-');
                    if ($can_sign_now && $current_user_id && isset($users[$current_user_id])) {
                        $current_name = $users[$current_user_id];
                        $current_date = $today;
                    } else {
                        $current_date = '-';
                    }
                }

                $initial_hide_class = ($level_index > 1 && ($isNewRecord || $model_status == $DRAFT_STATUS || $model_status === null)) ? ' signature-container-level-hidden' : '';
                $show_status_remark_fields = $can_sign_now || $has_existing_signature || $current_status === '0';
                ?>

                <div class="col-md-4 col-sm-6 signature-level-container level-<?= $level_index ?><?= $initial_hide_class ?><?= $has_signed_class ?>">
                    <div class="signature-box">
                        <div class="signature-title"><?= $label_text ?></div>

                        <?= Html::hiddenInput('TravelExpenseApproval[' . $level_index . '][signature]', ($has_existing_signature ? $current_signature_data : ''), ['id' => 'travelexpenseapproval-' . $field_name, 'class' => 'signature-data-input']) ?>

                        <div class="existing-signature-display" style="<?= $signature_display_style ?>">
                            <?php if (!empty($show_img_path)): ?>
                                <img src="<?= $show_img_path ?>" alt="Signature" class="signature-preview">
                                <hr style="margin: 15px 0;">
                            <?php endif; ?>
                        </div>

                        <?php if (empty($show_img_path)): ?>
                            <div class="<?= $is_status_restricted ? 'status-restricted-text' : 'unsigned-text' ?>">
                                <?= $is_status_restricted ? 'ไม่สามารถลงนามได้' : 'ยังไม่ได้ลงนาม' ?>
                            </div>
                        <?php endif; ?>

                        <?php if ($show_status_remark_fields): ?>
                            <div class="status-remark-section">
                                <div class="form-group">
                                    <label>สถานะการดำเนินการ</label>
                                    <?= Html::dropDownList($status_field_name, $current_status, ['1' => 'อนุมัติ (Approved)', '0' => 'ไม่อนุมัติ (Rejected)'], $status_field_options) ?>
                                </div>
                                <div class="form-group remark-group-<?= $level_index ?>" style="<?= ($current_status == '0') ? 'display: block;' : 'display: none;' ?>">
                                    <label>เหตุผล/Remark</label>
                                    <?= Html::textarea($remark_field_name, $current_remark, $remark_field_options) ?>
                                </div>
                            </div>
                        <?php endif; ?>

                        <div class="file-upload-option" style="<?= ($is_disabled || !empty($show_img_path)) ? 'display: none;' : '' ?>">
                            <label>ตัวเลือกการลงลายเซ็น:</label>
                            <div class="radio">
                                <label><?= Html::radio('sign_type_' . $field_name, true, array_merge($is_disabled_field, ['value' => 'upload', 'data-target' => '#upload-box-' . $field_name, 'class' => 'sign-type-radio'])) ?>แนบไฟล์ลายเซ็น (JPG/PNG)</label>
                            </div>
                            <div class="radio">
                                <label><?= Html::radio('sign_type_' . $field_name, false, array_merge($is_disabled_field, ['value' => 'draw', 'data-target' => '#pad-box-' . $field_name, 'class' => 'sign-type-radio'])) ?> วาดลายเซ็น</label>
                            </div>
                        </div>

                        <div id="upload-box-<?= $field_name ?>" class="file-upload-wrapper" style="display: none;">
                            <div class="form-group">
                                <?= Html::fileInput('SignatureUpload[' . $field_name . ']', null, array_merge($is_disabled_field, ['id' => 'signatureupload-' . $field_name, 'class' => 'form-control signature-file-upload', 'accept' => 'image/jpeg, image/png'])) ?>
                                <small class="text-muted">รองรับไฟล์ JPG, PNG ขนาดรูปที่แนะนำ: 400 × 150 px</small>
                                <div class="preview-box-container">
                                    <img id="preview-<?= $field_name ?>" class="signature-preview-img" style="<?= !$sigData ? 'display:none' : '' ?>">
                                    <span id="txt-preview-<?= $field_name ?>" style="<?= $sigData ? 'display:none' : '' ?>">Preview Image</span>
                                </div>
                                <button type="button" class="btn btn-warning btn-sm js-reset-sig mt-1" data-id="<?= $level_index ?>" data-field="<?= $field_name ?>">
                                    <i class="mdi mdi-eraser"></i> แก้ไข / ล้าง
                                </button>
                            </div>
                        </div>

                        <div id="pad-box-<?= $field_name ?>" class="signature-pad-wrapper" style="display: none;">
                            <canvas id="signature-pad-<?= $field_name ?>" class="signature-pad-canvas"></canvas>
                            <div class="signature-tools">
                                <?= Html::button('<i class="mdi mdi-eraser"></i> ล้างลายเซ็น', array_merge($is_disabled_field, ['type' => 'button', 'class' => 'btn btn-warning btn-sm clear-signature-btn', 'data-target' => '#signature-pad-' . $field_name])) ?>
                            </div>
                        </div>

                        <div class="file-input-section pt-3" data-level="<?= $level_index ?>" style="<?= ($is_disabled || !empty($show_img_path)) ? 'display: none;' : '' ?>">
                            <label class="me-3">
                                <span class="text-danger">*</span>
                                บันทึกลายเซ็นไว้ใช้ครั้งถัดไป:
                            </label>

                            <div class="d-flex align-items-center gap-3">
                                <label class="mb-0">
                                    <?= Html::radio('sign_save_' . $field_name, !$is_draw_default, [
                                        'value' => 'save',
                                        'class' => 'sign-save-radio',
                                        'data-target' => '#save-box-' . $field_name
                                    ]) ?>
                                    บันทึกไว้
                                </label>

                                <label class="mb-0">
                                    <?= Html::radio('sign_save_' . $field_name, $is_draw_default, [
                                        'value' => 'not_save',
                                        'class' => 'sign-save-radio',
                                        'data-target' => '#notsave-box-' . $field_name
                                    ]) ?>
                                    ไม่บันทึก
                                </label>
                            </div>
                        </div>

                        <div class="name-input-section mt-auto pt-3">
                            <div class="form-group">
                                <label>ชื่อผู้ลงนาม/Signer Name</label>
                                <?= Html::textInput($name_field_name, $current_name, ['class' => 'form-control', 'readonly' => true]) ?>
                            </div>
                            <div class="form-group">
                                <label>วันที่/Date</label>
                                <?= Html::textInput($date_field_name, $current_date, ['class' => 'form-control', 'readonly' => true]) ?>
                            </div>
                        </div>
                    </div>
                </div>
                <?php $level_index++; ?>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<?php

$isNewRecordJs = json_encode($isNewRecord);
$usersJson = json_encode($users);
$currentUserIdJs = json_encode($current_user_id);

$js = <<<JS
var pads = {};
var ALL_USERS = {$usersJson};
var IS_NEW_RECORD = {$isNewRecordJs};
var CURRENT_USER_ID = {$currentUserIdJs};
var TODAY_DATE = '{$today}';

function initSignaturePad(canvas) {
    var id = jQuery(canvas).attr('id');
    var fieldName = id.replace('signature-pad-', '');
    var hiddenInput = jQuery('#travelexpenseapproval-' + fieldName); 
    var signatureBox = jQuery(canvas).closest('.signature-box');
    
    if (typeof SignaturePad === 'undefined') return;
    
    var canvasContainer = jQuery(canvas).parent();
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    var cssWidth = canvasContainer.width(); 
    var cssHeight = 150; 
    
    var data = pads[id] ? pads[id].toData() : null;

    canvas.width = cssWidth * ratio;
    canvas.height = cssHeight * ratio; 
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    pads[id] = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 0.5, 
        maxWidth: 2.5 
    });
    
    canvas.getContext('2d').scale(ratio, ratio); 
    pads[id].clear();
    
    if (data) {
        pads[id].fromData(data);
    } else if (hiddenInput.val().startsWith('data:image') && !signatureBox.hasClass('has-signed')) {
        pads[id].fromDataURL(hiddenInput.val());
    }

    if (signatureBox.hasClass('has-signed')) {
        pads[id].off();
    }

    pads[id].onEnd = function() {
        if (!pads[id].isEmpty()) {
            hiddenInput.val(pads[id].toDataURL("image/png"));
        } else {
            hiddenInput.val('');
        }
    };
}

function saveDrawingSignature(fieldName) {
    var hiddenInput = jQuery('#travelexpenseapproval-' + fieldName);
    var container = hiddenInput.closest('.signature-box');
    var signType = jQuery('input[name="sign_type_' + fieldName + '"]:checked').val();
    
    if (container.hasClass('has-signed')) return;

    if (signType === 'draw') {
        var padId = 'signature-pad-' + fieldName;
        if (pads[padId] && !pads[padId].isEmpty()) {
            hiddenInput.val(pads[padId].toDataURL("image/png"));
        }
    } else if (signType === 'upload') {
        if (hiddenInput.val().startsWith('data:image')) {
            hiddenInput.val('');
        }
    }
}

jQuery(document).on('change', '.sign-type-radio', function() {
    var radio = jQuery(this);
    var fieldName = radio.attr('name').replace('sign_type_', '');
    var targetId = radio.data('target');
    
    if (radio.closest('.signature-box').is('.has-signed, .cannot-sign')) return;

    jQuery('#upload-box-' + fieldName + ', #pad-box-' + fieldName).hide();
    jQuery(targetId).show();
    
    if (radio.val() === 'draw') {
        jQuery('#signatureupload-' + fieldName).val('');
        initSignaturePad(document.getElementById('signature-pad-' + fieldName));
    } else {
        var padId = 'signature-pad-' + fieldName;
        if (pads[padId]) pads[padId].clear();
        jQuery('#travelexpenseapproval-' + fieldName).val('');
    }
});

jQuery(document).on('change', '.signature-file-upload', function() {
    var fileInput = this;
    var fieldName = jQuery(fileInput).attr('id').replace('signatureupload-', '');
    var previewImg = jQuery('#preview-' + fieldName);

    if (fileInput.files && fileInput.files[0]) {
        var file = fileInput.files[0];
        if (!file.type.match('image/(jpeg|png)')) {
            Swal.fire('Error', 'ไฟล์ต้องเป็น JPG หรือ PNG', 'error');
            fileInput.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            previewImg.attr('src', e.target.result).show();
            $('#txt-preview-' + fieldName).hide();
        };
        reader.readAsDataURL(file);
    }
});

$(document).on('click', '.js-reset-sig', function() {
    var field = $(this).data('field');
    $('#signatureupload-'+field).val('').trigger('change');
    $('#preview-' + field).attr('src', '').hide();
    $('#txt-preview-' + field).show();
});

jQuery(document).on('change', '.approval-status-select', function() {
    var select = jQuery(this);
    var level = select.data('level');
    var container = select.closest('.signature-box');
    var isRejected = select.val() === '0';
    
    if (isRejected) {
        jQuery('.remark-group-' + level).slideDown();
        container.find('.file-upload-option, .file-upload-wrapper, .signature-pad-wrapper, .existing-signature-display').slideUp();
        container.find('.signature-data-input, .signature-file-upload').val('');
        var padId = 'signature-pad-' + container.find('.signature-pad-canvas').attr('id')?.replace('signature-pad-', '');
        if (pads[padId]) pads[padId].clear();
    } else {
        jQuery('.remark-group-' + level).slideUp();
        if (container.find('.signature-preview').length > 0) {
            container.find('.existing-signature-display').slideDown();
        } else {
            container.find('.file-upload-option').slideDown();
            jQuery('input[name="sign_type_signature_' + container.find('.signature-data-input').attr('id').split('-').pop() + '"]:checked').trigger('change');
        }
    }
});

jQuery(document).on('click', '.clear-signature-btn', function() {
    var padId = jQuery(this).data('target').replace('#', '');
    var fieldName = padId.replace('signature-pad-', '');
    if (pads[padId]) {
        pads[padId].clear();
        jQuery('#travelexpenseapproval-' + fieldName).val('');
    }
});

jQuery(document).on('submit', '#travel-expense-form', function(e) {
    var validationFailed = false;
    var errorMsg = "";
    var action = jQuery(document.activeElement).val();

    if (['save_new_record', 'save_draft', 'send_manager_approve', 'send_veridate_check_approve', 'send_veridate_manage_check_approve', 'send_veridate_approver', 'approver_save'].includes(action)) {
        jQuery('.signature-level-container.can-sign').each(function() {
            var container = jQuery(this);
            var status = container.find('.approval-status-select').val();
            var fieldName = container.find('.signature-data-input').attr('id').replace('travelexpenseapproval-', '');
            var title = container.find('.signature-title').text().replace(/^\d+\.\s*/, '');

            saveDrawingSignature(fieldName);

            if (status === '1' || !status) {
                var hasFile = container.find('.signature-file-upload')[0]?.files.length > 0;
                var hasData = container.find('.signature-data-input').val() !== '';
                var hasPreview = container.find('.existing-signature-display img').length > 0 && container.find('.existing-signature-display').is(':visible');
                
                if (!hasFile && !hasData && !hasPreview) {
                    errorMsg = 'กรุณาลงนามสำหรับ ' + title;
                    validationFailed = true;
                    return false;
                }
            } else if (status === '0' && !jQuery('#remark-' + container.find('.approval-status-select').data('level')).val().trim()) {
                errorMsg = 'กรุณาระบุเหตุผลที่ไม่อนุมัติ';
                validationFailed = true;
                return false;
            }
        });

        if (validationFailed) {
            e.preventDefault();
            Swal.fire({ icon: 'warning', title: 'แจ้งเตือน', text: errorMsg });
            return false;
        }
        Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }
});

jQuery(document).ready(function() {
    jQuery('.signature-pad-canvas').each(function() { initSignaturePad(this); });
    
    jQuery('.signature-level-container').each(function() {
        var container = jQuery(this);
        var hasImg = container.find('.existing-signature-display img').length > 0;
        
        if (hasImg) {
            container.find('.file-upload-option, .file-upload-wrapper, .signature-pad-wrapper').hide();
        } else if (container.hasClass('can-sign')) {
            container.find('.file-upload-option').show();
            container.find('.sign-type-radio[value="upload"]').prop('checked', true).trigger('change');
        }
    });

    jQuery(window).on('resize', function() {
        jQuery('.signature-pad-canvas').each(function() {
            var padId = jQuery(this).attr('id');
            if (pads[padId] && jQuery(this).is(':visible')) {
                var data = pads[padId].toData();
                initSignaturePad(this);
                pads[padId].fromData(data);
            }
        });
    });
});
JS;
$this->registerJs($js, View::POS_READY);
?>
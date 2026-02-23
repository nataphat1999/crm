<?php

use yii\helpers\Html;
use yii\widgets\ActiveForm;
use app\models\TravelExpenseItem; 
use kartik\select2\Select2;
use yii\web\View;
use app\libs\Constant; 
use yii\helpers\Json;
use yii\helpers\Url;

$isNewRecord = $model->isNewRecord || $model->code === '-' || empty($model->code);
$codeJs = json_encode($model->id);
$isNewRecordJs = json_encode($isNewRecord);
$hasExistingBankNo = json_encode(!empty($model->transfer_account_number));
$hasExistingBankBranch = json_encode(!empty($model->transfer_bank_branch));
$originalPayeeIdJs = json_encode($model->employee_id ?? '');

Yii::$app->view->registerJs("
    console.log('model->code = ' + $codeJs);
    console.log('isNewRecord = ' + $isNewRecordJs);
");
$statusKey = $model->status ?? '';
$textStatus = $isNewRecord ? 'สร้าง' : (Constant::STATUS_EXPENSE[$statusKey] ?? 'สถานะไม่ทราบ');

$currentUserId = \Yii::$app->user->id ?? null;
$canEditOnRejectOrDraft = (
    ($statusKey == \app\libs\Constant::STATUS_EXPENSE_DRAFT || $statusKey == \app\libs\Constant::STATUS_EXPENSE_REJECTED) && 
    ($currentUserId == $model->requestor_id)
);

$isEditable = $isNewRecord || $canEditOnRejectOrDraft;

$isApproverLevel2 = ($statusKey == Constant::STATUS_EXPENSE_WAITING_MANAGER_RECEIVER && isset($modelsApproval[2]) && $modelsApproval[2]->approver_id == $currentUserId);
$isApproverLevel3 = ($statusKey == Constant::STATUS_EXPENSE_WAITING_CHECKER && isset($modelsApproval[3]) && $modelsApproval[3]->approver_id == $currentUserId);
$isApproverLevel4 = ($statusKey == Constant::STATUS_EXPENSE_WAITING_MANAGER_CHECKER && isset($modelsApproval[4]) && $modelsApproval[4]->approver_id == $currentUserId);
$isApproverLevel5 = ($statusKey == Constant::STATUS_EXPENSE_WAITING_APPROVER && isset($modelsApproval[5]) && $modelsApproval[5]->approver_id == $currentUserId);

$usersData = isset($usersData) ? $usersData : [];
$usersDataJson = json_encode($usersData);
$payeesData = isset($payeesData) ? $payeesData : []; 
$payeesDataJson = json_encode($payeesData);

$users = isset($users) ? $users : [];
$payees = isset($payToUsers) ? $payToUsers : [];
$positions = isset($positions) ? $positions : [];
$departments = isset($departments) ? $departments : [];

if ($isNewRecord) {
    $model->code = '-';
    $model->request_date = date('Y-m-d'); 
    $model->cheque_date = date('Y-m-d');
}

$checkSetDoc = \app\models\SettingDocument::find()
    ->where(['doc_type' => 'TRAVEL-EXPENSE', 'type' => 'DOCUMENT_CODE'])
    ->one();
$isDocReady = ($checkSetDoc && !empty(trim($checkSetDoc->value))) ? 1 : 0;
?>

<div class="expense-request-form">
    <div class="panel panel-default">
        <div class="panel-body">
            
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 15px;"> 
                <div class="font-size-18">
                    <?= '<span class="badge rounded-pill ' . 
                        (Constant::STATUS_EXPENSE_COLORS[$model->status] ?? 'btn-secondary-soft') 
                    . '">' . $textStatus . '</span> ' . $this->title; ?>
                </div>
                <div class="header-actions d-flex gap-2">
                    <?php if (!$isNewRecord): ?>
                        <button type="button" 
                            class="btn btn-secondary-soft btn-preview-pdf" 
                            data-url="<?= Url::to(['travel-expense/pdf', 'id' => $model->id], true) ?>" 
                            data-ready="<?= $isDocReady ?>">
                            <i class="mdi mdi-eye"></i> <?= Yii::t('app', 'View Document'); ?>
                        </button>
                    <?php endif; ?>

                    <?php if ($isNewRecord): ?>
                        <?= Html::submitButton('<i class="mdi mdi-content-save-settings-outline"></i> ' . Yii::t('app', 'Save'), [
                            'class' => 'btn btn-primary',
                            'name' => 'action',
                            'value' => 'save_new_record'
                        ]) ?>
                    
                    <?php elseif ($canEditOnRejectOrDraft): ?>
                        <?= Html::submitButton('<i class="mdi mdi-content-save-settings-outline"></i> ' . Yii::t('app', 'Save'), ['class' => 'btn btn-warning-soft', 'name' => 'action', 'value' => 'save_draft']) ?>
                        <?= Html::submitButton('<i class="mdi mdi-file-send-outline"></i> ' . Yii::t('app', 'Send Approve'), ['class' => 'btn btn-primary', 'name' => 'action', 'value' => 'send_manager_approve']) ?>

                    <?php elseif ($isApproverLevel2): ?>
                        <?= Html::submitButton('<i class="mdi mdi-file-send-outline"></i> ' . Yii::t('app', 'Save'), ['class' => 'btn btn-primary', 'name' => 'action', 'value' => 'send_veridate_check_approve']) ?>

                    <?php elseif ($isApproverLevel3): ?>
                        <?= Html::submitButton('<i class="mdi mdi-file-send-outline"></i> ' . Yii::t('app', 'Save'), ['class' => 'btn btn-primary', 'name' => 'action', 'value' => 'send_veridate_manage_check_approve']) ?>

                    <?php elseif ($isApproverLevel4): ?>
                        <?= Html::submitButton('<i class="mdi mdi-file-send-outline"></i> ' . Yii::t('app', 'Save'), ['class' => 'btn btn-primary', 'name' => 'action', 'value' => 'send_veridate_approver']) ?>

                    <?php elseif ($isApproverLevel5): ?>
                        <?= Html::submitButton('<i class="mdi mdi-check-all"></i> ' . Yii::t('app', 'Save'), ['class' => 'btn btn-success', 'name' => 'action', 'value' => 'approver_save']) ?>
                    <?php endif; ?>
                </div>
               
            </div>
            <?php
                if (!isset($signatureFields)) {
                    $signatureFields = [
                        'requester' => ['text' => '1. ผู้ขอให้ดำเนินการ/Requested by', 'level' => 1],
                        'manager_dept' => ['text' => '2. ผู้จัดการฝ่าย/Manager (ผู้รับเงิน)', 'level' => 2],
                        'verifier' => ['text' => '3. เจ้าหน้าที่ตรวจสอบ/Verified by', 'level' => 3],
                        'manager_verifier' => ['text' => '4. ผู้จัดการตรวจสอบ/Manager (ผู้ตรวจ)', 'level' => 4],
                        'approver' => ['text' => '5. ผู้อนุมัติ/Authorized by', 'level' => 5],
                    ];
                }

                if ($model->status == Constant::STATUS_EXPENSE_REJECTED) {
                    foreach ($modelsApproval as $level => $approval) {
                        if (!empty($approval->remark)) {
                            
                            $labelName = '';
                            foreach ($signatureFields as $field) {
                                if ($field['level'] == $level) {
                                    $labelName = $field['text'];
                                    break;
                                }
                            }
                ?>
                            <div class="alert alert-danger mt-3" style="background-color: #fff5f5; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px;">
                                <div class="form-group mb-0">
                                    <label style="color: #EC536C; font-weight: bold; display: block;">
                                        <i class="mdi mdi-alert-circle-outline"></i> เหตุผลที่ไม่อนุมัติ / Remark
                                    </label>
                                    <div style="color: #EC536C; font-weight: bold; margin-bottom: 8px;">
                                        <?= $labelName ?>
                                    </div>
                                    <textarea class="form-control" rows="2" readonly
                                        style="background-color: #fff; border: 1px solid #dc3545; color: #721c24 !important; font-weight: 500; cursor: default;"><?= \yii\helpers\Html::encode($approval->remark) ?></textarea>
                                </div>
                            </div>
                <?php 
                            break;
                        }
                    }
                } 
                ?>

            <div class="row">
                <div class="col-md-6">
                    <?php
                        $codeOptions = ['maxlength' => true, 'readonly' => true,'disabled' => true];
                    ?>
                    <?= $form->field($model, 'code')->textInput($codeOptions)->label('เลขที่เอกสาร Code') ?>
                </div>
                <div class="col-md-6">
                    <?php
                        $displayRequestDate = "";
                        if ($isNewRecord || empty($model->request_date) || $model->request_date === '0000-00-00') {
                            $displayRequestDate = date('d/m/Y');
                        } else {
                            $dateObj = DateTime::createFromFormat('Y-m-d', $model->request_date);
                            $displayRequestDate = ($dateObj) ? $dateObj->format('d/m/Y') : date('d/m/Y');
                        }
                    ?>
                    <?= $form->field($model, 'request_date')->textInput([
                        'class' => 'form-control date-picker-field',
                        'disabled' => !$isEditable,
                        'value' => $displayRequestDate,
                        'autocomplete' => 'off',
                    ])->label('วันที่เอกสาร Date') ?>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-4">
                    <?= $form->field($model, 'requestor_id')->widget(Select2::classname(), [
                        'data' => $users,
                        'options' => [
                            'id' => 'requestor-select',
                            'placeholder' => 'เลือกผู้ขอให้ดำเนินการ',
                            'style' => 'width:100%;',
                            'disabled' => true,
                        ],
                        'pluginOptions' => [
                            'theme' => "bootstrap",
                            'width' => '100%',
                        ],
                    ])->label('ผู้ขอให้ดำเนินการ Requestor') ?>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <?= Html::label('แผนกผู้ขอ', 'requestor-department-select') ?>
                        <?= Html::dropDownList(
                            'requestor-department-view',
                            null,
                            $departments,
                            [
                                'prompt' => '-',
                                'id' => 'requestor-department-select',
                                'class' => 'form-control',
                                'disabled' => true
                            ]
                        ) ?>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <?= Html::label('ตำแหน่ง', 'requestor-position-select') ?>
                        <?= Html::dropDownList(
                            'requestor-position-view',
                            null,
                            $positions,
                            [
                                'prompt' => '-',
                                'id' => 'requestor-position-select',
                                'class' => 'form-control',
                                'disabled' => true
                            ]
                        ) ?>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <?= $form->field($model, 'employee_id')->widget(Select2::classname(), [
                        'data' => $payees,
                        'options' => [
                            'id' => 'payee-select',
                            'placeholder' => 'เลือกผู้รับเงิน',
                            'style' => 'width:100%;',
                            'disabled' => !$isEditable,
                        ],
                        'pluginOptions' => [
                            'allowClear' => true,
                            'theme' => "bootstrap",
                            'width' => '100%',
                        ],
                    ])->label('จ่ายให้ Pay to') ?>
                </div>
                <div class="col-md-6">
                    <?= $form->field($model, 'department_id')->dropDownList(
                        $departments,
                        ['prompt' => '-', 'id' => 'department-select', 'disabled' => true]
                    )->label('แผนก Department') ?>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <?= $form->field($model, 'purpose')->textInput(['maxlength' => true, 'readonly' => !$isEditable])->label('วัตถุประสงค์การเบิก Purpose') ?>
                </div>
                <div class="col-md-6">
                    <?= $form->field($model, 'remark_short')->textInput(['maxlength' => true, 'readonly' => !$isEditable])->label('หมายเหตุ Remark') ?>
                </div>
            </div>

            <div class="row">
                <div class="col-md-4">
                    <?= $form->field($model, 'payment_method')->widget(Select2::class, [
                        'data' => Constant::TYPE_PAYMENTS_TH,
                        'options' => [
                            'id' => 'payment-method-select',
                            'placeholder' => 'เลือกวิธีการรับเงิน',
                            'style' => 'width:100%;',
                            'disabled' => !$isEditable,
                        ],
                        'pluginOptions' => [
                            'theme' => "bootstrap",
                            'width' => '100%',
                        ],
                    ])->label('วิธีการรับเงิน Payment Method') ?>
                </div>
            </div>

            <div id="transfer-fields" class="row" style="display: none;">
                <div class="col-md-6">
                    <?= $form->field($model, 'transfer_account_number')->textInput(['maxlength' => true, 'readonly' => !$isEditable,'id' => 'transfer-account-number'])->label('เลขที่บัญชี/Account Number') ?>
                </div>
                <div class="col-md-6">
                    <?= $form->field($model, 'transfer_bank_branch')->textInput(['maxlength' => true, 'readonly' => !$isEditable,'id' => 'transfer-bank-branch'])->label('ธนาคารสาขา/Bank Branch') ?>
                </div>
            </div>

            <div id="cheque-fields" class="row" style="display: none;">
                <div class="col-md-6">
                    <?= $form->field($model, 'cheque_bank_branch')->textInput(['maxlength' => true, 'readonly' => !$isEditable])->label('ธนาคาร สาขา/Bank Branch') ?>
                </div>
                <div class="col-md-6">
                    <?php
                        $displayChequeDate = "";
                        if (empty($model->cheque_date) || $model->cheque_date === '0000-00-00') {
                            $displayChequeDate = date('d/m/Y');
                        } else {
                            $dateObj = DateTime::createFromFormat('Y-m-d', $model->cheque_date);
                            if ($dateObj) {
                                $displayChequeDate = $dateObj->format('d/m/Y');
                            } else {
                                $displayChequeDate = $model->cheque_date;
                            }
                        }
                    ?>
                    <?= $form->field($model, 'cheque_date')->textInput([
                        'class' => 'form-control date-picker-field',
                        'readonly' => !$isEditable,
                        'value' => $displayChequeDate,
                        'autocomplete' => 'off',
                    ])->label('เช็คลงวันที่/Cheque Date') ?>
                </div>
            </div>
            
        </div>
    </div>

</div>

<?php

$session = Yii::$app->session;
$modelErrors = Json::encode($session->getFlash('model_errors', 'null', true));
$itemErrors = Json::encode($session->getFlash('item_errors', 'null', true));
$logData = Json::encode($session->getFlash('db_log_data', 'null', true));
if ($logData === 'null') {
    $logData = Json::encode($session->getFlash('db_log', 'null', true));
}

$js = <<<JS
var USERS_DATA = {$usersDataJson};
var PAYEES_DATA = {$payeesDataJson};

function showStatusAlert(isSuccess, title, message) {
    var icon = isSuccess ? 'success' : 'error';
    
    Swal.fire({
        icon: icon,
        title: title,
        html: message,
        confirmButtonText: 'ตกลง',
        customClass: {
            popup: 'swal2-responsive' 
        }
    });
}

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

jQuery(document).ready(function() {
    
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 is not loaded. Cannot show alert.');
    } else {
        var logJson = decodeHtml('{$logData}');
        if (logJson && logJson !== 'null') {
            try {
                var logData = JSON.parse(logJson);
                console.groupCollapsed('1. DB Log Data');
                console.log('1. Expense Attributes');
                console.log(logData.expense_attributes);
                console.groupCollapsed('2. Expense Items Attributes');
                console.table(logData.expense_item_attributes);
                console.groupEnd();
                console.groupEnd();
            } catch (e) {
                console.error('Failed to parse DB log data JSON:', logJson);
            }
        }
        
        var successMessage = '{$session->getFlash('success', '', true)}';
        var errorMessage = '{$session->getFlash('error', '', true)}';

        if (successMessage) {
            showStatusAlert(true, 'บันทึกสำเร็จ', successMessage);
        } else if (errorMessage) {
            console.error('SERVER-SIDE VALIDATION FAILED: ' + errorMessage);
            showStatusAlert(false, 'บันทึกไม่สำเร็จ', 'การดำเนินการล้มเหลว: ' + errorMessage);
        }
    }

    jQuery('.date-picker-field').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        changeMonth: true,
        changeYear: true,
        language: 'th',
        orientation: "bottom"
    });

    function togglePaymentFields(method) {
        jQuery('#transfer-fields').hide();
        jQuery('#cheque-fields').hide();

        if (method === 'bank_transfer') {
            jQuery('#transfer-fields').show();
        } else if (method === 'cheque_bank') {
            jQuery('#cheque-fields').show();
        }
    }

    jQuery(document).on('change', '#payment-method-select', function() {
        togglePaymentFields(jQuery(this).val());
    });

    togglePaymentFields(jQuery('#payment-method-select').val());

    function updateRequestorDetails(userId) {
        jQuery('#requestor-department-select').val('').trigger('change');
        jQuery('#requestor-position-select').val('').trigger('change');

        if (userId && USERS_DATA[userId]) {
            let user = USERS_DATA[userId];

            if (user.department_id) {
                jQuery('#requestor-department-select').val(user.department_id).trigger('change');
            } else if (user.dept_id) {
                jQuery('#requestor-department-select').val(user.dept_id).trigger('change');
            }

            if (user.position_id) {
                jQuery('#requestor-position-select').val(user.position_id).trigger('change');
            } else if (user.position) {
                jQuery('#requestor-position-select').val(user.position).trigger('change');
            }
        }
    }

    let isFirstLoad = true; 

    function updatePayeeDepartment(payeeId) {
        let deptId = '';
        let userBankNo = '';     
        let userBankBranch = ''; 

        if (payeeId && PAYEES_DATA[payeeId]) {
            let data = PAYEES_DATA[payeeId];
            deptId = data.department_id || '';
            userBankNo = data.bank_no || '';
            userBankBranch = data.bank_branch || '';
        }

        jQuery('#department-select').val(deptId).trigger('change');
        let isNew = {$isNewRecordJs};
        if (!isNew && isFirstLoad) {
            isFirstLoad = false; 
            return;
        } else {
            jQuery('#transfer-account-number').val(userBankNo);
            jQuery('#transfer-bank-branch').val(userBankBranch);
            
            if (isFirstLoad) isFirstLoad = false;
        }
    }

    jQuery(document).on('change', '#requestor-select', function() {
        let userId = jQuery(this).val();
        updateRequestorDetails(userId);
    });

    jQuery(document).on('change', '#payee-select', function() {
        let payeeId = jQuery(this).val();
        updatePayeeDepartment(payeeId);
    });

    jQuery(document).ready(function() {
        updateRequestorDetails(jQuery('#requestor-select').val());
        updatePayeeDepartment(jQuery('#payee-select').val());
    });

    jQuery(document).on('click', '.btn-preview-pdf', function(e) {
        e.preventDefault();
        var pdfUrl = jQuery(this).data('url');
        var isReady = jQuery(this).data('ready');

        if (isReady == 0) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'ยังไม่ได้ตั้งค่ารหัสเอกสารในระบบกรุณาติดต่อผู้ดูแลระบบเพื่อตั้งค่าก่อนดูเอกสาร',
                icon: 'error',
                confirmButtonColor: '#163fe4',
                confirmButtonText: 'ตกลง'
            });
        } else {
            window.open(pdfUrl, '_blank');
        }
    });
});

JS;
$this->registerJs($js, \yii\web\View::POS_READY);


$style = <<<CSS
.form-control-disable-like {
    display: block;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #495057;
    background-color: #e9ecef;
    background-clip: padding-box;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    cursor: default;
    box-shadow: none;
    transition: none;
}
.form-group .form-control-disable-like {
    margin-bottom: 0;
}
.select2-container .select2-selection--single {
    height: calc(2.25rem + 2px);
}
.select2-container--default .select2-selection--single .select2-selection__rendered {
    line-height: 1.5;
    padding-top: 0.375rem;
}
CSS;
$this->registerCss($style);
?>
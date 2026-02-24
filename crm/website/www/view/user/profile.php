<?php
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = Yii::t('app', 'Profile');
?>

<style>
    div.required label.form-label:after, 
    div.required label.control-label:after {
        content: " *";
        color: red;
    }
    #preview-box-container img {
        max-width: 100%;
        max-height: 150px;
        border: 1px dashed #ddd;
        padding: 5px;
    }
</style>

<div class="user-profile">
    <div class="card">
        <div class="card-body">
            <h4 class="card-title"><?= Yii::t('user', 'ข้อมูลส่วนตัว') ?></h4>
            <hr>

            <?php $form = ActiveForm::begin([
                'id' => 'profile-form',
                'enableClientValidation' => true,
                'options' => ['enctype' => 'multipart/form-data'],
                'fieldConfig' => [
                    'options' => ['class' => 'form-group mb-3'],
                ],
            ]); ?>

            <div class="row">
                <div class="col-md-12">
                    <div class="form-group mb-3">
                        <label class="form-label"><?= Yii::t('user', 'Position') ?></label>
                        <?php 
                            $fullPosition = "-";
                            if ($model->position) {
                                $fullPosition = 'Company: ' . ($model->position->department->company->name ?? '-') . 
                                                ' / Department: ' . ($model->position->department->name ?? '-') . 
                                                ' / Position: ' . $model->position->name;
                            }
                            echo Html::textInput('full_pos', $fullPosition, ['class' => 'form-control', 'disabled' => true]);
                        ?>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <?= $form->field($model, 'username')->textInput(['disabled' => true])->label(Yii::t('user', 'Username')) ?>
                </div>
                <div class="col-md-6">
                    <?= $form->field($model, 'email')->textInput(['type' => 'email'])->label(Yii::t('user', 'Email')) ?>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <?= $form->field($model, 'first_name')->textInput()->label(Yii::t('user', 'First Name')) ?>
                </div>
                <div class="col-md-6">
                    <?= $form->field($model, 'last_name')->textInput()->label(Yii::t('user', 'Last Name')) ?>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <?= $form->field($model, 'mobile')->textInput()->label(Yii::t('user', 'Mobile')) ?>
                </div>
            </div>

            <h4 class="card-title mt-4"><?= Yii::t('user', 'ข้อมูลธนาคาร') ?></h4>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <?= $form->field($model, 'bank_branch')->textInput()->label(Yii::t('app', 'Bank Branch')) ?>
                </div>
                <div class="col-md-6">
                    <?= $form->field($model, 'bank_no')->textInput()->label(Yii::t('app', 'Bank Account No.')) ?>
                </div>
            </div>

            <h4 class="card-title mt-4"><?= Yii::t('user', 'ลายเซ็น') ?></h4>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label"><b><?= Yii::t('user', 'ตัวเลือกการลงลายเซ็น') ?></b></label>
                    <div class="signature-box border p-3 rounded bg-white">
                        <div class="mb-3">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input sign-type-radio" type="radio" name="sig_type" id="sig_upload" value="upload" checked>
                                <label class="form-check-label" for="sig_upload">แนบไฟล์ (JPG/PNG)</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input sign-type-radio" type="radio" name="sig_type" id="sig_draw" value="draw">
                                <label class="form-check-label" for="sig_draw">วาดลายเซ็น</label>
                            </div>
                        </div>

                        <div id="upload-box-profile" class="sig-wrapper">
                            <?= $form->field($model, 'signature_path')->fileInput([
                                'id' => 'user-signature_path',
                                'class' => 'form-control',
                                'accept' => 'image/png, image/jpeg'
                            ])->label(false) ?>
                            
                            <div id="preview-box-container" style="display:none;" class="mt-2 text-center">
                                <div class="small text-muted mb-1">ตัวอย่างไฟล์ที่เลือก:</div>
                                <img id="img-preview" src="#" alt="Preview">
                            </div>
                        </div>

                        <div id="pad-box-profile" class="sig-wrapper" style="display:none;">
                            <canvas id="signature-pad-profile" class="border rounded" style="width: 100%; height: 200px; background: #f9f9f9;"></canvas>
                            <div class="mt-2 text-end">
                                <button type="button" class="btn btn-sm btn-warning" id="clear-sig">ล้างลายเซ็น</button>
                            </div>
                        </div>

                        <?= $form->field($model, 'signature_base64')->hiddenInput(['id' => 'signature-data-profile'])->label(false) ?>
                    </div>
                </div>

                <div class="col-md-6 text-center">
                    <label class="form-label d-block text-start"><b><?= Yii::t('user', 'ลายเซ็นปัจจุบัน') ?></b></label>
                    <div class="border rounded p-2 bg-light d-flex align-items-center justify-content-center" style="height: 250px;">
                        <?php if ($model->signature_path): ?>
                            <?= Html::img(Yii::getAlias('@web/') . $model->signature_path, ['class' => 'img-fluid', 'style' => 'max-height: 200px;']) ?>
                        <?php else: ?>
                            <span class="text-muted">ยังไม่ได้ลงนาม</span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <div class="form-group mt-4 text-end">
                <?= Html::submitButton(Yii::t('app', 'Save'), ['class' => 'btn btn-success px-4']) ?>
            </div>

            <?php ActiveForm::end(); ?>
        </div>
    </div>
</div>

<?php
$js = <<<JS
    function toggleSignatureUI() {
        var type = $('.sign-type-radio:checked').val();
        if (type === 'upload') {
            $('#upload-box-profile').show();
            $('#pad-box-profile').hide();
            
            signaturePad.clear();
            $('#signature-data-profile').val('');
        } else {
            $('#upload-box-profile').hide();
            $('#pad-box-profile').show();
            
            var fileInput = $('#user-signature_path');
            fileInput.val('');
            if (fileInput.length) {
                fileInput.wrap('<form>').closest('form').get(0).reset();
                fileInput.unwrap();
            }
            
            $('#preview-box-container').hide();
            $('#img-preview').attr('src', '#');
            
            if (typeof resizeCanvas === 'function') {
                resizeCanvas(); 
            }
        }
    }

    var canvas = document.getElementById('signature-pad-profile');
    var signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)'
    });

    function resizeCanvas() {
        var ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
    }

    toggleSignatureUI();
    $('.sign-type-radio').on('change', toggleSignatureUI);

    $('#clear-sig').on('click', function() {
        signaturePad.clear();
        $('#signature-data-profile').val('');
    });

    $('#user-signature_path').on('change', function() {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#img-preview').attr('src', e.target.result);
                $('#preview-box-container').show();
            }
            reader.readAsDataURL(this.files[0]);
        } else {
            $('#preview-box-container').hide();
        }
    });

    $('#profile-form').on('beforeSubmit', function() {
        if ($('#sig_draw').is(':checked') && !signaturePad.isEmpty()) {
            var data = signaturePad.toDataURL('image/png');
            $('#signature-data-profile').val(data);
        }
        return true;
    });
JS;

if (Yii::$app->session->hasFlash('detailNoti')) {
    $type = Yii::$app->session->getFlash('typeNoti');
    $title = Yii::$app->session->getFlash('titleNoti');
    $detail = Yii::$app->session->getFlash('detailNoti');
    $isSuccess = ($type === 'success') ? 'true' : 'false';

    $js .= <<<JS
        if (typeof showStatusAlert === 'function') {
            showStatusAlert({$isSuccess}, "{$title}", "{$detail}");
        } else {
            Swal.fire({
                title: "{$title}",
                html: "{$detail}",
                icon: "{$type}",
                confirmButtonText: "ตกลง"
            });
        }
JS;
}

$this->registerJs($js);
?>
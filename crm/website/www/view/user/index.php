<?php

use app\models\User;
use yii\helpers\Html;
use yii\helpers\Url;
use yii\grid\ActionColumn;
use yii\grid\GridView;
use yii\web\View;

/** @var yii\web\View $this */
/** @var app\models\UserSearch $searchModel */
/** @var yii\data\ActiveDataProvider $dataProvider */

$this->title = Yii::t('user', 'Users');
$this->params['breadcrumbs'][] = ['label' => $this->title, 'template' => "<li class=\"breadcrumb-item\"><h4>{link}</h4></li>\n"];

$titleNoti = Yii::$app->session->getFlash('titleNoti');
$detailNoti = Yii::$app->session->getFlash('detailNoti');
$typeNoti = Yii::$app->session->getFlash('typeNoti');
$showNoti = !empty($titleNoti) && !empty($detailNoti) && !empty($typeNoti) ? 'true' : 'false';

$js = <<<EOT
var showNoti = $showNoti;
var titleNoti = '$titleNoti';
var detailNoti = '$detailNoti';
var typeNoti = '$typeNoti';
EOT;
$this->registerJs($js, View::POS_HEAD);
?>
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h1>
                    <button type="button" class="btn btn-outline-primary waves-effect waves-light" data-bs-toggle="modal" data-bs-target="#create-modal">
                        <i class="mdi mdi-plus-circle-outline"></i> <?= Yii::t('user', 'Create User'); ?>
                    </button>
                    <button type="button" class="btn btn-outline-primary waves-effect waves-light" data-bs-toggle="modal" data-bs-target="#reaccount-modal">
                        <i class="mdi mdi-ballot-recount"></i> <?= Yii::t('user', 'Restore a user'); ?>
                    </button>
                </h1>

                <table id="tb-users" class="table table-sm m-0 table-bordered dt-responsive w-100" style="width:100%;border: 1px solid black;border-radius: 3px;">
                    <thead style="background-color: #69696d47;border-radius: 0px;">
                        <tr>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'No.') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Full Name') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Username') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Email') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Mobile') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Company') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Create At') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Updated At') ?></th>
                            <th class="text-center tb-head-item mdi mdi-cog-outline" style="font-size:14px ;color:#163fe4;border-bottom: 1px solid black;width:74px;"></th>
                        </tr>
                    </thead>

                    <tbody>
                        <?php foreach ($dataProvider->getModels() as $key => $val) {
                            if ($val->status == 10) {
                                echo '<tr>';
                                echo '<td class="text-center tb-list-body"></td>';
                                echo '<td class="text-center tb-list-body" >' . $val->first_name . ' ' . $val->last_name . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->username . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->email . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->mobile . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->position->department->company->name . '/' . $val->position->department->name . '/' . $val->position->name . '</td>';
                                echo '<td class="text-center tb-list-body">' . date('d/m/Y H:i:s', $val->created_at) . '</td>';
                                echo '<td class="text-center tb-list-body">' . date('d/m/Y H:i:s', $val->updated_at) . '</td>';
                                echo '<td class="text-center tb-list-body">
                                        <div class="dropdown">
                                            <button class="btn btn-secondary dropdown-toggle" type="button" id="manage-companies" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <i class="mdi mdi-chevron-down"></i>
                                            </button>
                                            <div class="dropdown-menu" aria-labelledby="manage-companies">
                                                <a class="dropdown-item edit-user" href="javascript:void(0)" data-id="' . $val->id . '" ><i class="mdi mdi-lead-pencil"></i> ' . Yii::t('app', 'Edit') . '</a>
                                                <a class="dropdown-item reset-password" href="javascript:void(0)" data-id="' . $val->id . '" ><i class="mdi mdi-lock-reset"></i> ' . Yii::t('user', 'Reset Pass') . '</a>
                                                <a class="dropdown-item delete_button" href="javascript:void(0)" data-id="' . $val->id . '" data-url="' . Url::to(['delete', 'id' => $val->id]) . '" ><i class="mdi mdi-delete"></i> ' . Yii::t('app', 'Delete') . '</a>
                                            </div>
                                        </div>
                                    </td>';
                                echo '</tr>';
                            }
                        } ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<!-- User MODAL -->
<div class="modal fade modal-lg" id="create-modal" tabindex="-1" aria-labelledby="modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header py-3 px-4 border-bottom-0">

                <h5 class="modal-title" id="modal-title"><?= Yii::t('user', 'User'); ?> </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4">
                <form method="POST" class="needs-validation" action="<?= Url::toRoute(['create']) ?>" name="user-form" id="form-user" novalidate autocomplete="off">

                    <!-- CSRF Token for Yii2 Security -->
                    <input type="hidden" name="<?= Yii::$app->request->csrfParam; ?>" value="<?= Yii::$app->request->csrfToken; ?>" />
                    <input type="hidden" name="id" id="ce-userid" value="" />

                    <div class="row g-3">
                        <!-- First Name -->
                        <div class="col-md-6">
                            <label for="first_name" class="form-label"><?= Yii::t('user', 'First Name'); ?> <span class="text-danger">*</span></label>
                            <input class="form-control" placeholder="<?= Yii::t('user', 'Enter First Name'); ?>" type="text" name="first_name" id="first_name" required />
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid First Name'); ?></div>
                        </div>

                        <!-- Last Name -->
                        <div class="col-md-6">
                            <label for="last_name" class="form-label"><?= Yii::t('user', 'Last Name'); ?> <span class="text-danger">*</span></label>
                            <input class="form-control" placeholder="<?= Yii::t('user', 'Enter Last Name'); ?>" type="text" name="last_name" id="last_name" required />
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid Last Name'); ?></div>
                        </div>
                    </div>
                    <div class="row">
                        <!-- Username -->
                        <div class="col-md-6 set-user">
                            <label for="username" class="form-label"><?= Yii::t('user', 'Username'); ?> <span class="text-danger">*</span></label>
                            <input class="form-control" placeholder="<?= Yii::t('user', 'Enter Username'); ?>" type="text" name="username" id="username" autocomplete="new-username" required />
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid Username'); ?></div>
                        </div>

                        <!-- Password -->
                        <div class="col-md-6 set-user">
                            <label for="password_hash" class="form-label"><?= Yii::t('user', 'Password'); ?> <span class="text-danger">*</span></label>
                            <!-- Note: type="password" usually shouldn't have a 'value' for security reasons -->
                            <input class="form-control" placeholder="<?= Yii::t('user', 'Enter Password'); ?>" type="password" name="password_hash" id="password_hash" autocomplete="new-password" required />
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid Password'); ?></div>
                        </div>
                    </div>
                    <div class="row">
                        <!-- Email -->
                        <div class="col-md-6">
                            <label for="user_email" class="form-label"><?= Yii::t('user', 'Email'); ?> <span class="text-danger">*</span></label>
                            <input class="form-control" placeholder="<?= Yii::t('user', 'example@email.com'); ?>" type="email" name="email" id="user_email" required />
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid Email'); ?></div>
                        </div>

                        <!-- Mobile -->
                        <div class="col-md-6">
                            <label for="user_mobile" class="form-label"><?= Yii::t('user', 'Mobile'); ?> <span class="text-danger">*</span></label>
                            <input class="form-control" placeholder="<?= Yii::t('user', '08xxxxxxxx'); ?>" type="tel" name="mobile" id="user_mobile"  onkeypress="return isNumber(event)" required />
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid Mobile'); ?></div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label for="bank_name" class="form-label"><?= Yii::t('user', 'Bank Branch'); ?> </label>
                            <input class="form-control" placeholder="<?= Yii::t('user', 'Enter Bank Branch'); ?>" type="text" name="bank_branch" id="bank_branch"  />
                          
                        </div>
                        <div class="col-md-6">
                            <label for="bank_no" class="form-label"><?= Yii::t('user', 'Bank No.'); ?> </label>
                            <input
                                class="form-control"
                                placeholder="<?= Yii::t('user', 'Enter Bank No.'); ?>"
                                type="text"
                                name="bank_no"
                                id="bank_no"
                                inputmode="numeric"
                                oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                                 />

                        </div>
                    </div>
                    <div class="row">
                        <!-- Position -->
                        <div class="col-md-6">
                            <label for="dd_position" class="form-label"><?= Yii::t('user', 'Position'); ?> <span class="text-danger">*</span></label>
                            <?= Html::dropDownList('position_id', '', $positions, [
                                'prompt' => Yii::t('user', 'Select Position'),
                                'class' => 'form-select',
                                'id' => 'dd_position',
                                'required' => true
                            ]); ?>
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please select a Position'); ?></div>
                        </div>

                        <!-- Permission -->
                        <div class="col-md-6">
                            <label for="permission" class="form-label"><?= Yii::t('user', 'Permission'); ?> <span class="text-danger">*</span></label>
                            <?= Html::dropDownList('permission', '', $permissions, [
                                'prompt' => Yii::t('user', 'Select Permission'),
                                'class' => 'form-select',
                                'id' => 'permission',
                                'required' => true
                            ]); ?>
                            <div class="invalid-feedback"><?= Yii::t('user', 'Please select a Permission'); ?></div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="row mt-4">
                        <div class="col-12 text-end">
                            <button type="button" class="btn btn-light me-2" data-bs-dismiss="modal"><?= Yii::t('user', 'Close'); ?></button>
                            <button type="submit" class="btn btn-primary" id="btn-save-user"><?= Yii::t('app', 'Create'); ?>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- end modal-->

<div class="modal fade" id="reset-pass" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header py-3 px-4 border-bottom-0">
                <h5 class="modal-title" id="modal-title"><?= Yii::t('user', 'Reset Pass'); ?></h5>

                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-hidden="true"></button>

            </div>
            <div class="modal-body p-4">
                <form method="POST" class="needs-validation" action="<?= Url::to(['reset-password']) ?>" name="user-form" id="form-reset" novalidate>

                    <div class="row">
                        <div class="col-12">
                            <div class="mb-3">
                                <label class="form-label"><?= Yii::t('user', 'Password'); ?></label>
                                <input class="form-control" placeholder="Password" type="password" name="password_hash" required value="" />
                                <div class="invalid-feedback"><?= Yii::t('user', 'Please provide a valid Password'); ?></div>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <!-- <button type="button" class="btn btn-danger" id="btn-delete-event">Delete</button> -->
                        </div>
                        <div class="col-6 text-end">
                            <button type="button" class="btn btn-light me-1" data-bs-dismiss="modal"><?= Yii::t('user', 'Close'); ?></button>
                            <input type="hidden" name="id" id="rep-userid" />
                            <button type="submit" class="btn btn-success" id="btn-save-reset"><?= Yii::t('user', 'Reset Pass'); ?></button>
                        </div>
                    </div>
                </form>
            </div>
        </div> <!-- end modal-content-->
    </div> <!-- end modal dialog-->

</div>
<div class="modal fade modal-xl" id="reaccount-modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header py-3 px-4 border-bottom-0">
                <h5 class="modal-title" id="modal-title"><?= Yii::t('user', 'Restore a user'); ?></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-hidden="true"></button>
            </div>
            <div class="modal-body">
                <table id="reusers-tb" class="table table-sm m-0 table-bordered" style="border: 1px solid black;border-radius: 3px;width: 100%;">
                    <thead style="background-color: #69696d47;border-radius: 0px;">
                        <tr>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'No.') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Full Name') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Username') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Email') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Mobile') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Company') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Create At') ?></th>
                            <th class="text-center tb-head-item"><?= Yii::t('user', 'Updated At') ?></th>
                            <th class="text-center tb-head-item mdi mdi-cog-outline" style="font-size:14px ;color:#163fe4;border-bottom: 1px solid black;width:74px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($dataProvider->getModels() as $key => $val) {
                            if ($val->status != 10) {
                                echo '<tr>';
                                echo '<td class="text-center tb-list-body"></td>';
                                echo '<td class="text-center tb-list-body" >' . $val->first_name . ' ' . $val->last_name . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->username . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->email . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->mobile . '</td>';
                                echo '<td class="text-center tb-list-body">' . $val->position->department->company->name . '/' . $val->position->department->name . '/' . $val->position->name . '</td>';
                                echo '<td class="text-center tb-list-body">' . date('d/m/Y H:i:s', $val->created_at) . '</td>';
                                echo '<td class="text-center tb-list-body">' . date('d/m/Y H:i:s', $val->updated_at) . '</td>';
                                echo '<td class="text-center tb-list-body">
                                <button class="btn btn-primary btn-reaccount" type="button" data-id="' . $val->id . '" data-url="' . Url::to(['restore', 'id' => $val->id]) . '">
                                            <i class="mdi mdi-refresh"></i>  ' . Yii::t('user', 'Restore') . '
                                            </button>
                                    </td>';
                                echo '</tr>';
                            }
                        } ?>
                    </tbody>
                </table>
            </div>
        </div> <!-- end modal-content-->
    </div> <!-- end modal dialog-->
</div>
<?php
$edit_url = Url::toRoute(['detail']);
$script = <<< JS
$(document).ready(function(){
    var tableUser = $("#tb-users").DataTable({
        bDestroy: true,
        ordering: true,
        order: [[6, "desc"]],
        columnDefs: [
            { searchable: false, orderable: false, targets: 0},
            { orderable: false, targets: 8 }
        ],
        language: getTHDataTable(),
    });

    addNumTB(tableUser);

    $(document).on('click', '.reset-password', function() {
        $('#rep-userid').val($(this).data('id'));
        $('#reset-pass').modal('show');
        $('#form-reset').attr('action', $('#form-reset').attr('action')+'?id='+$(this).data('id'));
    });

    $('#user_mobile').on('keyup',function(){
        phoneMask($(this));
    });

    $(this).on('click','.edit-user',function(){
        var userid = $(this).data('id');
        //get position
        $.ajax({
            url: '$edit_url',
            type: 'post',
            data: {
                id: userid,
                _csrf: yii.getCsrfToken(),
            },
            success: function (val) {
                if(val){
                    $('.set-user').remove();

                    $('#first_name').val(val.data.first_name);
                    $('#last_name').val(val.data.last_name);
                    
                    $('#user_email').val(val.data.email);
                    $('#user_mobile').val(val.data.mobile);
                    $('#dd_position').val(val.data.position_id);
                    $('#permission').val(val.data.permission);
                    $('#bank_branch').val(val.data.bank_branch);
                     $('#bank_no').val(val.data.bank_no);
                    $('#ce-userid').val(userid);

                    $('#form-user').attr('action', '/user/update?id='+userid);
                    $('#btn-save-user').text('แก้ไข');
                    $('#create-modal').modal('show');
                }
            },
            error: function (jqXHR, exception) {
                var msg = getMsgError(jqXHR, exception);
                    
                    console.log(msg);
            }
        });
    });

    $('#create-modal').on('hidden.bs.modal', function () {
        //clear form
        $("#form-user")[0].reset();
        $('#form-user').removeClass('was-validated');
        $('#form-user').attr('action', '/user/create');
        $('#btn-save-user').text('Add');
    });

    $('#create-modal').on('shown.bs.modal', function () {
        phoneMask($('#user_mobile'));
    });

    var tableReUser = $("#reusers-tb").DataTable({
        bDestroy: true,
        ordering: true,
        order: [[6, "desc"]],
        columnDefs: [
            { searchable: false, orderable: false, targets: 0},
            { orderable: false, targets: 8 }
        ],
        language: getTHDataTable(),
    });

    addNumTB(tableReUser);

    $(this).on('click','.btn-reaccount',function(){
        var userid = $(this).data('id');
        var url = $(this).data("url");
        Swal.fire({
                    // title: "Are you sure?",
                    title: "กู้คืนข้อมูลผู้ใช้ คุณแน่ใจไหม?",
                    // text: "User ID: "+userid,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "ใช่ กู้คืน!",
                    cancelButtonText: "ยกเลิก",
                }).then((result) => {
                    if (result.isConfirmed) {
                    $.ajax({
                        url: url,
                        type: "post",
                        data: {
                        id: userid,
                        _csrf: yii.getCsrfToken(),
                        },
                        success: function (val) {
                        if (val.status == true) {
                            var newPass = val.newpassword;
                            Swal.fire({
                                title: "กู้คืนแล้ว!",
                                html: "ผู้ใช้ของคุณถูกกู้คืนแล้ว รหัสใหม่คือ <span class='txt-copy'>"+newPass+"</span><br><br>สามารถเปลี่ยนรหัสได้ที่ <b>ตั้งค่ารหัสใหม่</b>",
                                icon: "success",
                                dangerMode: true,
                            }).then(
                                function () {
                                    window.location.reload();
                                }
                            );
                        } else {
                            Swal.fire("กู้คืนไม่สำเร็จ!", "ผู้ใช้ของคุณถูกกู้คืนล้มเหลว", "error").then(
                            function () {
                                window.location.reload();
                            }
                            );
                        }
                        },
                        error: function (jqXHR, exception) {
                        var msg = getMsgError(jqXHR, exception);

                        console.log(msg);
                        },
                    });
                    }
                });
    });
}); 
JS;

$this->registerJs($script, View::POS_END);
?>
<style>
    tbody,
    td,
    tfoot,
    th,
    thead,
    tr {

        border-style: none;

    }
</style>
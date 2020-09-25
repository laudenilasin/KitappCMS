$('select').selectpicker();

$(document).ready(function() {

  jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "formatted-num-pre": function ( a ) {
        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
        return parseFloat( a );
    },
 
    "formatted-num-asc": function ( a, b ) {
        return a - b;
    },
 
    "formatted-num-desc": function ( a, b ) {
        return b - a;
    }
} );

	$('#products').DataTable( {
      "columnDefs": [{ "orderable": false, "targets": [1,2,9] },
      { type: 'formatted-num', targets: [3,4,5,6,7,8] }],
     	language: { search: "", searchPlaceholder: "Search..." },
	});

  $('#users').DataTable( {
     //"lengthChange": false,
      "columnDefs": [{ "orderable": false, "targets": [4] }],
      language: { search: "", searchPlaceholder: "Search..." },
  });   
});

function readURL(input) {
  if (input.files && input.files[0]) {
    console.log('type', input.files[0].type)
    if(input.files[0].type == 'image/jpeg' || input.files[0].type == 'image/png'){
      var files = input.files[0]
      var filesize = ((files.size/1024)/1024).toFixed(4);
      console.log('filesize', filesize)
      if(filesize >  5){
          $('#product-image-img').css('border', '1px solid red')
          $('#invalid-image').addClass('is-invalid')
          $('#if_invalid_image').text('File size: Max of 5 MB')
      }
      else{
        $('#product-image-img').css('border', '1px solid #ced4da')
          console.log('YES')
          var reader = new FileReader();
          reader.onload = function(e) {
            $('.image-upload-wrap').hide();
            $('.file-upload-image').attr('src', e.target.result);
            $('.file-upload-content').show();
            $('.image-title').html(input.files[0].name);
          };
          reader.readAsDataURL(input.files[0]);
          $('#invalid-image').removeClass('is-invalid')
          $('#if_invalid_image').text('File Format: PNG or JPG | File size: Max of 5 MB | 1 image upload only')
      }  
      
    }
    else{
      $('.file-upload-input').replaceWith($('.file-upload-input').clone());
      $('.file-upload-content').hide();
      $('.image-upload-wrap').show();
      $('.file-upload-image').attr('src', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D');
      $('#invalid-image').addClass('is-invalid')
      $('#if_invalid_image').text('File Format: PNG or JPG')
    }
  } 
  // else {
  //   $('.file-upload-input').replaceWith($('.file-upload-input').clone());
  //   $('.file-upload-content').hide();
  //   $('.file-upload-image').attr('src', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D');
  //   $('.image-upload-wrap').show();
  // }
}
function removeUpload() {
  swal({
    title: "Warning!",
    text: "Are you sure you want to remove this image?",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  })
  .then((willDelete) => {
    if (willDelete) {
      $('#product_image').val('');
      $('.completion').trigger('keyup');
      $('.file-upload-input').replaceWith($('.file-upload-input').clone());
      $('.file-upload-content').hide();
      $('.file-upload-image').attr('src', '#');
      $('.image-upload-wrap').show();
    }
  });
}
	$('.image-upload-wrap').bind('dragover', function () {
        $('.image-upload-wrap').addClass('image-dropping');
    });
    $('.image-upload-wrap').bind('dragleave', function () {
        $('.image-upload-wrap').removeClass('image-dropping');
});

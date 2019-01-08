export default function(title){
  var capitalize = function(c){ return c.toUpperCase()};
  var small = title.toLowerCase().replace(/_/g, ' ');
  if(small === 'id') return 'ID';
  if(small === 'tn93') return 'TN93';
  if(small === 'snps') return 'SNPs';
  if(small === '2d network') return '2D Network';
  if(small === '3d network') return '3D Network';
  if(small === 'geo map') return 'Map';
  return small.replace(/(?:^|\s|-)\S/g, capitalize);
};
